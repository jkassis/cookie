use serde::{Deserialize, Serialize};

/// **Trait for serializing/deserializing time-series data**
pub trait Data:
  Serialize + for<'de> Deserialize<'de> + Send + Sync + Clone
{
}

/// **Automatically implement `TimeSeriesData` for all valid types**
impl<T: Serialize + for<'de> Deserialize<'de> + Send + Sync + Clone> Data
  for T
{
}

/// **Trait for time-series storage operations**
pub trait Store<T: Data>: Send + Sync {
  /// **Inserts a new time-series entry with a specific timestamp**
  fn push(&mut self, timestamp: u64, entry: T);

  /// **Retrieves the closest previous entry while optimizing for playback**
  fn prev(&self, timestamp: u64) -> Option<(u64, T)>;

  /// **Retrieves the closest next entry while optimizing for playback**
  fn next(&self, timestamp: u64) -> Option<(u64, T)>;

  /// **Returns both first and last timestamps as a tuple (first, last)**
  /// Returns None when the store is empty
  fn timestamp_range(&self) -> Option<(u64, u64)>;

  /// **Returns the first (earliest) timestamp in the store**
  fn first_timestamp(&self) -> Option<u64> {
    self.timestamp_range().map(|(first, _)| first)
  }

  /// **Returns the last (latest) timestamp in the store**
  fn last_timestamp(&self) -> Option<u64> {
    self.timestamp_range().map(|(_, last)| last)
  }
}

// Blanket impl so Box<dyn Store<T> + Send + Sync> can be used as a Store<T>
impl<T: Data> Store<T> for Box<dyn Store<T> + Send + Sync> {
  fn push(&mut self, timestamp: u64, entry: T) {
    self.as_mut().push(timestamp, entry)
  }
  fn prev(&self, timestamp: u64) -> Option<(u64, T)> {
    self.as_ref().prev(timestamp)
  }
  fn next(&self, timestamp: u64) -> Option<(u64, T)> {
    self.as_ref().next(timestamp)
  }
  fn timestamp_range(&self) -> Option<(u64, u64)> {
    self.as_ref().timestamp_range()
  }
}
