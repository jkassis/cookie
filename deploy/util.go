package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"github.com/creack/pty"

	"gopkg.in/yaml.v3"

	"github.com/spf13/cobra"
	v "github.com/spf13/viper"
)

func tagFmt(host, image, version string) string {
	return fmt.Sprintf("%s/%s:%s", host, image, version)
}

func flagsAddString(cmd *cobra.Command, name, defaultValue, description string, required bool) {
	cmd.PersistentFlags().String(name, defaultValue, description)
	err := v.BindPFlag(name, cmd.PersistentFlags().Lookup(name))
	if err != nil {
		log.Fatalf("Error binding flag '%s': %v", name, err)
	}
	if required {
		err := cmd.MarkPersistentFlagRequired(name)
		if err != nil {
			log.Fatalf("Error marking flag '%s' as required: %v", name, err)
		}
	}
}

func flagsDump() {
	log.Printf(`
	If you would like to build or push a specific version...
	IMG_VERSION=x.y.z go run main.go build

	`)

	for _, k := range v.AllKeys() {
		log.Printf("'%s': %v", k, v.Get(k))
	}
}

func cwdLog() {
	pwd, err := os.Getwd()
	if err != nil {
		log.Printf("Error getting current directory: %v", err)
		return
	}
	log.Println("Running in:", pwd)
}

type OSExecOpts struct {
	stdoutPrint bool
	stdin       io.Reader
	usePTY      bool
}

func osExec(opts *OSExecOpts, command string, args ...string) (string, string, error) {
	cmd := exec.Command(command, args...)

	if opts.usePTY {
		return execWithPTY(opts, cmd)
	}
	return execWithoutPTY(opts, cmd)
}

func execWithPTY(opts *OSExecOpts, cmd *exec.Cmd) (string, string, error) {
	pty, err := pty.Start(cmd)
	if err != nil {
		return "", "", err
	}
	defer func() { _ = pty.Close() }()

	var stdoutBuf bytes.Buffer

	go func() {
		multiWriter := io.MultiWriter(&stdoutBuf, os.Stdout)
		if opts.stdoutPrint {
			_, _ = io.Copy(multiWriter, pty)
		} else {
			_, _ = io.Copy(&stdoutBuf, pty)
		}
	}()

	if opts.stdin != nil {
		go func() {
			_, _ = io.Copy(pty, opts.stdin)
		}()
	}

	err = cmd.Wait()
	return stdoutBuf.String(), "", err
}

func execWithoutPTY(opts *OSExecOpts, cmd *exec.Cmd) (string, string, error) {
	var stdoutBuf, stderrBuf bytes.Buffer

	if opts.stdin != nil {
		cmd.Stdin = opts.stdin
	}

	stdoutWriter := io.MultiWriter(&stdoutBuf)
	if opts.stdoutPrint {
		stdoutWriter = io.MultiWriter(&stdoutBuf, os.Stdout)
	}
	cmd.Stdout = stdoutWriter
	cmd.Stderr = io.MultiWriter(&stderrBuf, os.Stderr)

	err := cmd.Run()
	return stdoutBuf.String(), stderrBuf.String(), err
}

func ecrHostGetRegion(ecrHost string) (string, error) {
	parts := strings.Split(ecrHost, ".")
	if len(parts) < 4 || !strings.Contains(parts[2], "ecr") {
		return "", fmt.Errorf("invalid ECR host format")
	}
	return parts[3], nil
}

func getLatestTagSHA(imgRegistryHost, imgPath string) (string, error) {
	imageURI := fmt.Sprintf("%s/%s:latest", imgRegistryHost, imgPath)
	out, _, err := osExec(&OSExecOpts{}, "docker", "manifest", "inspect", imageURI)
	if err != nil {
		return "", fmt.Errorf("failed to inspect manifest for %s: %v", imageURI, err)
	}

	var manifest struct {
		Config struct {
			Digest string `json:"digest"`
		} `json:"config"`
	}

	if err := json.Unmarshal([]byte(out), &manifest); err != nil {
		return "", fmt.Errorf("failed to parse manifest JSON: %v", err)
	}

	// Return the SHA part of the digest
	return strings.Split(manifest.Config.Digest, ":")[1], nil
}

func validateECRImage(imgRegistryHost, imgPath, sha string) error {
	log.Printf("Validating image in ECR: %s/%s:%s", imgRegistryHost, imgPath, sha)

	// Construct the AWS ECR command
	repoName := strings.TrimPrefix(imgPath, fmt.Sprintf("%s/", imgRegistryHost))
	cmdArgs := []string{
		"ecr", "describe-images",
		"--repository-name", repoName,
		"--image-ids", fmt.Sprintf("imageTag=%s", sha),
	}

	// Execute the AWS CLI command
	_, _, err := osExec(&OSExecOpts{}, "aws", cmdArgs...)
	if err != nil {
		if strings.Contains(err.Error(), "ImageNotFoundException") {
			return fmt.Errorf("image not found in the remote registry: %s/%s:%s", imgRegistryHost, imgPath, sha)
		}
		return fmt.Errorf("failed to query ECR: %v", err)
	}

	log.Printf("Image %s/%s:%s exists in the remote registry.", imgRegistryHost, imgPath, sha)
	return nil
}

func updateHelmValuesFile(valuesFilePath, sha string) error {
	data, err := os.ReadFile(valuesFilePath)
	if err != nil {
		return fmt.Errorf("failed to read values file: %v", err)
	}

	var values map[string]interface{}
	if err := yaml.Unmarshal(data, &values); err != nil {
		return fmt.Errorf("failed to parse values file: %v", err)
	}

	// Update the image.tag property
	image, ok := values["image"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("image property not found in values file")
	}
	image["tag"] = sha

	// Save the updated values file
	updatedData, err := yaml.Marshal(values)
	if err != nil {
		return fmt.Errorf("failed to serialize values file: %v", err)
	}
	if err := os.WriteFile(valuesFilePath, updatedData, 0644); err != nil {
		return fmt.Errorf("failed to write updated values file: %v", err)
	}

	log.Printf("Updated image.tag to %s in %s", sha, valuesFilePath)
	return nil
}

func commitAndPushChanges(repoDir, sha string) error {
	// Change to the GitOps repo directory
	if err := os.Chdir(repoDir); err != nil {
		return fmt.Errorf("failed to change directory to %s: %v", repoDir, err)
	}

	// Stage the changes
	if _, _, err := osExec(&OSExecOpts{}, "git", "add", "."); err != nil {
		return fmt.Errorf("failed to stage changes: %v", err)
	}

	// Commit the changes
	commitMessage := fmt.Sprintf("Release version %s", sha)
	if _, _, err := osExec(&OSExecOpts{}, "git", "commit", "-m", commitMessage); err != nil {
		return fmt.Errorf("failed to commit changes: %v", err)
	}

	// Push the changes
	if _, _, err := osExec(&OSExecOpts{}, "git", "push"); err != nil {
		return fmt.Errorf("failed to push changes: %v", err)
	}

	log.Println("Changes committed and pushed successfully.")
	return nil
}

func ensureNoUncommittedChanges() error {
	out, _, err := osExec(&OSExecOpts{}, "git", "status", "--porcelain")
	if err != nil {
		return err
	}
	if strings.TrimSpace(out) != "" {
		return fmt.Errorf("there are uncommitted changes in your working directory")
	}
	return nil
}

func ensureBranchInSync() error {
	if _, _, err := osExec(&OSExecOpts{stdoutPrint: true}, "git", "fetch"); err != nil {
		return err
	}

	out, _, err := osExec(&OSExecOpts{}, "git", "status", "-uno")
	if err != nil {
		return err
	}
	if strings.Contains(out, "Your branch is behind") || strings.Contains(out, "have diverged") {
		return fmt.Errorf("your branch is not in sync with the upstream")
	}
	return nil
}

func getCurrentGitSHA() (string, error) {
	out, _, err := osExec(&OSExecOpts{}, "git", "rev-parse", "HEAD")
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(out), nil
}

func bumpHelmChartVersion(chartFilePath string) error {
	data, err := os.ReadFile(chartFilePath)
	if err != nil {
		return fmt.Errorf("failed to read chart file: %v", err)
	}

	var chart map[string]interface{}
	if err := yaml.Unmarshal(data, &chart); err != nil {
		return fmt.Errorf("failed to parse chart file: %v", err)
	}

	// Bump the patch version for both `version` and `appVersion`
	chart["version"] = bumpPatchVersion(chart["version"].(string))
	chart["appVersion"] = bumpPatchVersion(chart["appVersion"].(string))

	// Save the updated chart file
	updatedData, err := yaml.Marshal(chart)
	if err != nil {
		return fmt.Errorf("failed to serialize chart file: %v", err)
	}
	if err := os.WriteFile(chartFilePath, updatedData, 0644); err != nil {
		return fmt.Errorf("failed to write updated chart file: %v", err)
	}

	log.Printf("Bumped Helm chart version to %s and appVersion to %s", chart["version"], chart["appVersion"])
	return nil
}

func bumpPatchVersion(version string) string {
	parts := strings.Split(version, ".")
	if len(parts) != 3 {
		log.Fatalf("Invalid semantic version: %s", version)
	}

	patch, err := strconv.Atoi(parts[2])
	if err != nil {
		log.Fatalf("Invalid patch number in version: %s", version)
	}

	// Increment the patch number
	parts[2] = strconv.Itoa(patch + 1)
	return strings.Join(parts, ".")
}
