package main

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	v "github.com/spf13/viper"
)

func main() {
	log.SetFlags(0) // Simple log format
	flagsInit()

	if err := mainCmd.Execute(); err != nil {
		log.Fatalf("Error executing command: %v", err)
	}
}

var mainCmd = &cobra.Command{
	Use:   "build",
	Short: "Tool for building and pushing Docker images",
	Long:  `A tool that facilitates the building and pushing of Docker images with configurable parameters.`,
}

func flagsInit() {
	flagsAddString(mainCmd, "IMG_PATH", "", "Name of the image", false)
	flagsAddString(mainCmd, "IMG_REGISTRY_HOST", "", "Host for the Docker registry", false)
	flagsAddString(mainCmd, "IMG_PLATFORM", "linux/amd64", "IMG_PLATFORM for docker build", false)
	mainCmd.AddCommand(buildCmd, pushCmd, releaseCmd)
	v.AutomaticEnv()
}

var buildCmd = &cobra.Command{
	Use:   "build",
	Short: "Builds the Docker image",
	Long:  `Builds a Docker image based on the provided configuration flags and environment variables.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		log.Println("\n\n\nStarting Docker build process...")
		cwdLog()
		flagsDump()

		// Step 1: Check for uncommitted changes
		if err := ensureNoUncommittedChanges(); err != nil {
			return fmt.Errorf("uncommitted changes detected: %v", err)
		}

		// Step 2: Get the current version from Git SHA
		version, err := getCurrentGitSHA()
		if err != nil {
			return fmt.Errorf("failed to get current Git SHA: %v", err)
		}
		log.Printf("Using version from Git SHA: %s", version)

		// Step 3: Validate environment variables
		IMG_PATH := v.GetString("IMG_PATH")
		if IMG_PATH == "" {
			return fmt.Errorf("IMG_PATH is required but not set")
		}

		IMG_PLATFORM := v.GetString("IMG_PLATFORM")
		if IMG_PLATFORM == "" {
			return fmt.Errorf("IMG_PLATFORM is required but not set")
		}

		IMG_REGISTRY_HOST := v.GetString("IMG_REGISTRY_HOST")
		if IMG_REGISTRY_HOST == "" {
			return fmt.Errorf("IMG_REGISTRY_HOST is required but not set")
		}

		NPM_TOKEN := os.Getenv("NPM_TOKEN")
		if NPM_TOKEN == "" {
			log.Println("\n\n\nWarning: NPM_TOKEN is not set. Proceeding without it.")
		}

		// Step 4: Format tags
		versionTag := tagFmt(IMG_REGISTRY_HOST, IMG_PATH, version)
		latestTag := tagFmt(IMG_REGISTRY_HOST, IMG_PATH, "latest")

		// Step 5: Execute Docker build command
		log.Printf("Building image with tags: %s, %s", versionTag, latestTag)
		cmdArgs := []string{
			"buildx", "build",
			"--progress=plain",
			"--load",
			"--platform", IMG_PLATFORM,
			"--build-arg", fmt.Sprintf("NPM_TOKEN=%s", NPM_TOKEN),
			"-t", versionTag,
			"-t", latestTag,
			"-f", "./deploy/Dockerfile",
			".",
		}

		if _, _, err := osExec(&OSExecOpts{stdoutPrint: true}, "docker", cmdArgs...); err != nil {
			log.Printf("Docker build failed: %v", err)
			return err
		}

		log.Println("\n\n\nDocker build process completed successfully.")
		return nil
	},
}

var pushCmd = &cobra.Command{
	Use:   "push",
	Short: "Pushes the Docker image",
	Long:  `Pushes the latest Docker image to the specified registry using the provided configuration.`,
	RunE: func(cmd *cobra.Command, args []string) (err error) {
		log.Println("\n\n\nExecuting push process")
		cwdLog()
		flagsDump()

		// Step 1: Check for uncommitted changes
		if err := ensureNoUncommittedChanges(); err != nil {
			return fmt.Errorf("uncommitted changes detected: %v", err)
		}

		// Step 2: Get the current version from Git SHA
		version, err := getCurrentGitSHA()
		if err != nil {
			return fmt.Errorf("failed to get current Git SHA: %v", err)
		}
		log.Printf("\n\n\nUsing version from Git SHA: %s", version)

		// Step 3: Validate environment variables
		IMG_PATH := v.GetString("IMG_PATH")
		if IMG_PATH == "" {
			return fmt.Errorf("IMG_PATH is required but not set")
		}

		IMG_PLATFORM := v.GetString("IMG_PLATFORM")
		if IMG_PLATFORM == "" {
			return fmt.Errorf("IMG_PLATFORM is required but not set")
		}

		IMG_REGISTRY_HOST := v.GetString("IMG_REGISTRY_HOST")
		if IMG_REGISTRY_HOST == "" {
			return fmt.Errorf("IMG_REGISTRY_HOST is required but not set")
		}

		NPM_TOKEN := os.Getenv("NPM_TOKEN")
		if NPM_TOKEN == "" {
			log.Println("\n\n\nWarning: NPM_TOKEN is not set. Proceeding without it.")
		}

		// Step 4: Format tags
		versionTag := tagFmt(IMG_REGISTRY_HOST, IMG_PATH, version)
		latestTag := tagFmt(IMG_REGISTRY_HOST, IMG_PATH, "latest")

		// Step 5: Ensure the branch is in sync with the remote
		if err := ensureBranchInSync(); err != nil {
			return err
		}

		// Step 6: Push to ECR
		var region string
		if region, err = ecrHostGetRegion(IMG_REGISTRY_HOST); err != nil {
			return err
		}

		log.Println("\n\n\nGetting AWS ECR Token")
		awsToken, _, _ := osExec(&OSExecOpts{stdoutPrint: false}, "aws", "ecr", "get-login-password", "--region", region)

		log.Println("\n\n\nLogging in to Docker")
		_, _, err = osExec(&OSExecOpts{stdoutPrint: false, stdin: bytes.NewReader([]byte(awsToken))}, "docker", "login", "--username", "AWS", "--password-stdin", IMG_REGISTRY_HOST)
		if err != nil {
			return err
		}

		log.Printf("\n\n\nPushing %s\n", versionTag)
		_, _, err = osExec(&OSExecOpts{stdoutPrint: true, usePTY: true, stdin: bytes.NewReader([]byte(awsToken))}, "docker", "push", versionTag)
		if err != nil {
			return err
		}

		log.Printf("\n\n\nPushing %s\n", latestTag)
		_, _, err = osExec(&OSExecOpts{stdoutPrint: true, usePTY: true, stdin: bytes.NewReader([]byte(awsToken))}, "docker", "push", latestTag)
		if err != nil {
			return err
		}

		log.Printf("\n\n\nPush Complete")
		return nil
	}}

var releaseCmd = &cobra.Command{
	Use:   "release [SHA]",
	Short: "Releases a new version by updating the GitOps repo",
	Long: `Validates that the Docker image has been pushed, updates the Helm values file,
and bumps the version in the Helm chart file before committing and pushing the changes.`,
	Args: cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		log.Println("\n\n\nStarting release process...")
		cwdLog()
		flagsDump()

		// Load required values from flags
		imgRegistryHost := v.GetString("IMG_REGISTRY_HOST")
		imgPath := v.GetString("IMG_PATH")
		gitOpsRepoDir := v.GetString("GITOPS_REPO_DIR")
		helmValuesFilePath := v.GetString("HELM_VALUES_FILE_PATH")
		helmChartFilePath := v.GetString("HELM_CHART_FILE_PATH")

		if imgRegistryHost == "" || imgPath == "" || gitOpsRepoDir == "" || helmValuesFilePath == "" || helmChartFilePath == "" {
			return fmt.Errorf("missing required configuration values")
		}

		// Step 1: Check for uncommitted changes
		if err := ensureNoUncommittedChanges(); err != nil {
			return fmt.Errorf("uncommitted changes detected: %v", err)
		}

		// Step 2: Get the current version from Git SHA
		version, err := getCurrentGitSHA()
		if err != nil {
			return fmt.Errorf("failed to get current Git SHA: %v", err)
		}
		log.Printf("Using version from Git SHA: %s", version)

		// Validate that the image exists in ECR
		imageURI := fmt.Sprintf("%s/%s:%s", imgRegistryHost, imgPath, version)
		log.Printf("Validating that the image exists in ECR: %s", imageURI)
		if err := validateECRImage(imgRegistryHost, imgPath, version); err != nil {
			return fmt.Errorf("image validation failed: %v", err)
		}

		// Update the Helm values file
		valuesFilePath := filepath.Join(gitOpsRepoDir, helmValuesFilePath)
		log.Printf("Updating Helm values file: %s", valuesFilePath)
		if err := updateHelmValuesFile(valuesFilePath, version); err != nil {
			return fmt.Errorf("failed to update Helm values file: %v", err)
		}

		// Bump the Helm chart version
		chartFilePath := filepath.Join(gitOpsRepoDir, helmChartFilePath)
		log.Printf("Bumping Helm chart version in: %s", chartFilePath)
		if err := bumpHelmChartVersion(chartFilePath); err != nil {
			return fmt.Errorf("failed to bump Helm chart version: %v", err)
		}

		// Commit and push the changes
		if err := commitAndPushChanges(gitOpsRepoDir, version); err != nil {
			return fmt.Errorf("failed to commit and push changes: %v", err)
		}

		log.Println("\n\n\nRelease process completed successfully.")
		return nil
	},
}
