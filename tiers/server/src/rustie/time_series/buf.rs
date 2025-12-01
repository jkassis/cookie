use super::base;
use super::base::Data;

/// Trait for aggregating multiple entries into one
pub trait Aggregate: Sized {
  fn aggregate(entries: Vec<Self>) -> Self;
}

/// Trait for getting byte size of an entry
pub trait ByteSize {
  fn byte_size(&self) -> usize;
}

/// For Vec<u8> (fMP4 fragments), concatenate all fragments
impl Aggregate for Vec<u8> {
  fn aggregate(entries: Vec<Self>) -> Self {
    let mut result = Vec::new();
    for entry in entries {
      result.extend_from_slice(&entry);
    }
    result
  }
}

/// For Vec<u8>, the byte size is just the length
impl ByteSize for Vec<u8> {
  fn byte_size(&self) -> usize {
    self.len()
  }
}

/// Buffered writer - aggregates many small entries into fewer large chunks for efficient disk writes
pub struct BufferedWriter<T: Data + Aggregate + ByteSize, S: base::Store<T>> {
  buffer: Vec<T>,
  chunk_size_bytes: usize,
  accumulated_bytes: usize,
  delegate: S,
  buffer_start_timestamp: Option<u64>,
}

impl<T: Data + Aggregate + ByteSize, S: base::Store<T>> BufferedWriter<T, S> {
  pub fn new(chunk_size_bytes: usize, delegate: S) -> Self {
    Self {
      buffer: Vec::new(),
      chunk_size_bytes,
      accumulated_bytes: 0,
      delegate,
      buffer_start_timestamp: None,
    }
  }

  fn flush(&mut self) {
    if self.buffer.is_empty() {
      return;
    }

    let timestamp = self
      .buffer_start_timestamp
      .expect("Buffer has entries but no timestamp");
    log::info!(
            "Buffered writer: flushing {} fragments ({} bytes) as aggregated chunk, timestamp {}",
            self.buffer.len(),
            self.accumulated_bytes,
            timestamp
        );

    // Drain all buffered entries and aggregate them
    let entries: Vec<T> = self.buffer.drain(..).collect();
    let aggregated = T::aggregate(entries);

    self.delegate.push(timestamp, aggregated);

    // Reset for next buffer
    self.buffer_start_timestamp = None;
    self.accumulated_bytes = 0;
  }
}

impl<T: Data + Aggregate + ByteSize, S: base::Store<T>> base::Store<T>
  for BufferedWriter<T, S>
{
  fn push(&mut self, timestamp: u64, entry: T) {
    // Set timestamp for this buffer if it's the first entry
    if self.buffer_start_timestamp.is_none() {
      self.buffer_start_timestamp = Some(timestamp);
    }

    // Track accumulated bytes
    self.accumulated_bytes += entry.byte_size();
    self.buffer.push(entry);

    // Flush when we've accumulated enough bytes
    if self.accumulated_bytes >= self.chunk_size_bytes {
      self.flush();
    }
  }

  fn prev(&self, timestamp: u64) -> Option<(u64, T)> {
    // For reads, just delegate without any caching
    // Use FMP4Reader for efficient playback instead
    self.delegate.prev(timestamp)
  }

  fn next(&self, timestamp: u64) -> Option<(u64, T)> {
    // For reads, just delegate without any caching
    // Use FMP4Reader for efficient playback instead
    self.delegate.next(timestamp)
  }

  fn timestamp_range(&self) -> Option<(u64, u64)> {
    self.delegate.timestamp_range()
  }
}

pub type BufferedStore<T, S> = BufferedWriter<T, S>;

impl<T: Data + Aggregate + ByteSize, S: base::Store<T>> Drop
  for BufferedWriter<T, S>
{
  fn drop(&mut self) {
    // Flush any remaining buffered data when the writer is dropped
    if !self.buffer.is_empty() {
      log::info!(
        "Buffered writer: dropping with {} buffered fragments, flushing...",
        self.buffer.len()
      );
      self.flush();
    }
  }
}
