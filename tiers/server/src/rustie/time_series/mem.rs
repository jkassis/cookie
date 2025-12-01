use super::base;
use super::base::Data;
use std::{
  collections::BTreeMap,
  time::{SystemTime, UNIX_EPOCH},
};

/// **In-memory Time-Series Store (no disk I/O)**
pub struct Store<T: Data> {
  index: BTreeMap<u64, T>,
  max_entries: usize,
  time_limit: Option<u64>,
}

impl<T: Data + 'static> Store<T> {
  pub fn new(max_entries: usize, time_limit: Option<u64>) -> Self {
    Self {
      index: BTreeMap::new(),
      max_entries,
      time_limit,
    }
  }

  fn enforce_limits(&mut self) {
    let current_time = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_millis() as u64;

    // Prune based on time limit
    if let Some(time_limit) = self.time_limit {
      let cutoff_time = current_time - time_limit;
      while let Some((&oldest_time, _)) = self.index.iter().next() {
        if oldest_time >= cutoff_time {
          break;
        }
        self.index.remove(&oldest_time);
      }
    }

    // Prune based on entry count
    while self.index.len() > self.max_entries {
      if let Some((&oldest_time, _)) = self.index.iter().next() {
        self.index.remove(&oldest_time);
      }
    }
  }
}

impl<T: Data + 'static> base::Store<T> for Store<T> {
  fn push(&mut self, timestamp: u64, entry: T) {
    self.index.insert(timestamp, entry);
    self.enforce_limits();
  }

  /// **Retrieves the closest previous entry while optimizing for playback**
  fn prev(&self, timestamp: u64) -> Option<(u64, T)> {
    if let Some((key, val)) = self.index.range(..=timestamp).next_back() {
      Some((*key, val.clone()))
    } else {
      None
    }
  }

  /// **Retrieves the closest next entry while optimizing for playback**
  fn next(&self, timestamp: u64) -> Option<(u64, T)> {
    // Get the first entry with timestamp > the given timestamp
    if let Some((key, val)) = self.index.range((timestamp + 1)..).next() {
      Some((*key, val.clone()))
    } else {
      None
    }
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
