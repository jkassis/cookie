use super::base;
use super::base::Data;

use std::{
  collections::BTreeMap,
  fs,
  io::{Read, Write},
  marker::PhantomData,
  path::{Path, PathBuf},
  time::{SystemTime, UNIX_EPOCH},
};

/// **Disk-based Time-Series Data Store**
pub struct Store<T: Data> {
  index: BTreeMap<u64, PathBuf>, // Ordered index for fast queries
  total_size: u64,               // Storage size in bytes
  store_dir: PathBuf,            // Storage path (e.g., "data/audio/")
  max_size: u64,                 // Max allowed storage size
  time_limit: Option<u64>,       // Max age of stored entries (in milliseconds)
  size_limit_target_threshold: f64, // Target % of max size for pruning (default: 80%)
  age_limit_target_threshold: f64, // Target % of time limit for pruning (default: 80%)
  _time_series_data: PhantomData<T>,
}

impl<T: Data + 'static> Store<T> {
  /// **Initializes the time-series store, ensuring the directory exists**
  pub fn new(
    store_dir: &Path,
    max_size: u64,
    time_limit: Option<u64>, // Optional time-based pruning
    size_limit_target_threshold: f64,
    age_limit_target_threshold: f64,
  ) -> Self {
    fs::create_dir_all(store_dir)
      .expect("Failed to create time-series store directory");

    let mut store = Self {
      index: BTreeMap::new(),
      total_size: 0,
      store_dir: store_dir.to_path_buf(),
      max_size,
      time_limit,
      size_limit_target_threshold,
      age_limit_target_threshold,
      _time_series_data: PhantomData::<T>,
    };

    store.load_existing_files();
    store
  }

  /// **Loads existing files into the index at startup**
  fn load_existing_files(&mut self) {
    if let Ok(entries) = fs::read_dir(&self.store_dir) {
      for entry in entries.flatten() {
        if let Some(timestamp) = Self::extract_timestamp(&entry.path()) {
          let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
          self.index.insert(timestamp, entry.path());
          self.total_size += size;
        }
      }
    }
  }

  /// **Extracts a timestamp from a file name**
  fn extract_timestamp(path: &Path) -> Option<u64> {
    path
      .file_name()
      .and_then(|f| f.to_str())
      .and_then(|s| s.strip_suffix(".bin"))
      .and_then(|s| s.parse::<u64>().ok())
  }

  /// **Inserts a new time-series entry with a specific timestamp**
  fn push(&mut self, timestamp: u64, entry: T) {
    let file_path = self.store_dir.join(format!("{}.bin", timestamp));

    if let Ok(serialized) = bincode::serialize(&entry) {
      if let Ok(mut file) = fs::File::create(&file_path) {
        let _ = file.write_all(&serialized);
      }
      let size = serialized.len() as u64;
      self.index.insert(timestamp, file_path.clone());
      self.total_size += size;
    }

    self.enforce_limits();
  }

  /// **Returns the first (earliest) timestamp in the store**
  pub fn timestamp_first(&self) -> Option<u64> {
    self.index.keys().next().copied()
  }

  /// **Returns the last (latest) timestamp in the store**
  pub fn timestamp_last(&self) -> Option<u64> {
    self.index.keys().next_back().copied()
  }

  /// **Returns both first and last timestamps as a tuple (first, last)**
  pub fn timestamp_range(&self) -> (Option<u64>, Option<u64>) {
    (self.timestamp_first(), self.timestamp_last())
  }

  /// **Prunes oldest entries based on both size and time limits**
  fn enforce_limits(&mut self) {
    let current_time = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_millis() as u64;

    // Prune based on time limit
    if let Some(time_limit) = self.time_limit {
      let target_time = current_time
        - (time_limit as f64 * self.age_limit_target_threshold) as u64;
      while let Some((&oldest_time, oldest_path)) = self.index.iter().next() {
        if oldest_time >= target_time {
          break;
        }
        if let Ok(size) = oldest_path.metadata().map(|m| m.len()) {
          let _ = fs::remove_file(&oldest_path);
          self.total_size -= size;
        }
        self.index.remove(&oldest_time);
      }
    }

    // Prune based on size limit
    let target_size =
      (self.max_size as f64 * self.size_limit_target_threshold) as u64;
    while self.total_size > target_size {
      if let Some((&oldest_time, oldest_path)) = self.index.iter().next() {
        if let Ok(size) = oldest_path.metadata().map(|m| m.len()) {
          let _ = fs::remove_file(&oldest_path);
          self.total_size -= size;
        }
        self.index.remove(&oldest_time);
      }
    }
  }

  /// **Retrieves the closest previous entry while optimizing for playback**
  pub fn prev(&self, timestamp: u64) -> Option<(u64, T)> {
    if let Some((&closest_time, file_path)) =
      self.index.range(..=timestamp).next_back()
    {
      if let Ok(mut file) = fs::File::open(file_path) {
        let mut buffer = Vec::new();
        if file.read_to_end(&mut buffer).is_ok() {
          if let Ok(entry) = bincode::deserialize(&buffer) {
            return Some((closest_time, entry));
          }
        }
      }
    }
    None
  }

  /// **Retrieves the closest next entry while optimizing for playback**
  pub fn next(&self, timestamp: u64) -> Option<(u64, T)> {
    if let Some((&next_time, file_path)) = self.index.range(timestamp..).next()
    {
      if let Ok(mut file) = fs::File::open(file_path) {
        let mut buffer = Vec::new();
        if file.read_to_end(&mut buffer).is_ok() {
          if let Ok(entry) = bincode::deserialize(&buffer) {
            return Some((next_time, entry));
          }
        }
      }
    }
    None
  }
}

/// **Implement the TimeSeriesStore trait for DiskStore**
impl<T: Data + 'static> base::Store<T> for Store<T> {
  fn push(&mut self, timestamp: u64, entry: T) {
    self.push(timestamp, entry);
  }

  fn prev(&self, timestamp: u64) -> Option<(u64, T)> {
    self.prev(timestamp)
  }

  fn next(&self, timestamp: u64) -> Option<(u64, T)> {
    self.next(timestamp)
  }

  fn timestamp_range(&self) -> Option<(u64, u64)> {
    let first = self.index.keys().next().copied();
    let last = self.index.keys().next_back().copied();
    match (first, last) {
      (Some(first), Some(last)) => Some((first, last)),
      _ => None,
    }
  }
}
