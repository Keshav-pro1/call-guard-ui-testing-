import librosa
import torch
import torchaudio
import os
import numpy as np

class AudioProcessor:
    def __init__(self, silence_threshold_db=30):
        self.silence_threshold_db = silence_threshold_db

    def trim_silences(self, input_path, output_path, keep_after=3.0, keep_before=1.0):
        """
        Trims silences longer than keep_after + keep_before.
        Keeps 'keep_after' seconds of silence after speech and 'keep_before' seconds before speech.
        """
        print(f"Loading audio for trimming: {input_path}")
        y, sr = librosa.load(input_path, sr=None)
        
        # Get non-silent intervals
        non_silent_intervals = librosa.effects.split(y, top_db=self.silence_threshold_db)
        
        if len(non_silent_intervals) == 0:
            # Entirely silent or below threshold? Return original
            return False, 0, 0
            
        new_audio_segments = []
        original_duration = len(y) / sr
        
        # Process first segment
        first_start = non_silent_intervals[0][0]
        # Keep 'keep_before' or everything before if less
        start_trim = max(0, first_start - int(keep_before * sr))
        
        current_pos = start_trim
        
        for i in range(len(non_silent_intervals)):
            interval_start, interval_end = non_silent_intervals[i]
            
            # Start of this non-silent section (with lead-in)
            seg_start = max(0, interval_start - int(keep_before * sr))
            
            # If this is not the first segment, check the gap from previous
            if i > 0:
                prev_end = non_silent_intervals[i-1][1]
                # We want to keep 'keep_after' from prev_end and 'keep_before' from interval_start
                # The total gap allowed is keep_after + keep_before
                gap_start_point = prev_end + int(keep_after * sr)
                gap_end_point = interval_start - int(keep_before * sr)
                
                if gap_end_point > gap_start_point:
                    # There is a long silence to trim
                    # Extract up to gap_start_point
                    # We already added up to previous interval_end in the previous iteration (or so we should)
                    pass 
            
            # Simplified approach:
            # Just keep non-silent intervals + padding, and merge if they overlap
            pass

        # Let's try a simpler robust approach:
        # 1. Start with the first non-silent interval (with padding)
        # 2. For each subsequent interval, if it's "close enough" (gap <= keep_after + keep_before), merge.
        # 3. Else, cap the gap.
        
        processed_segments = []
        
        # Initial padding for the very first segment
        start_pad = max(0, non_silent_intervals[0][0] - int(keep_before * sr))
        end_pad = min(len(y), non_silent_intervals[0][1] + int(keep_after * sr))
        
        curr_start = start_pad
        curr_end = end_pad
        
        for i in range(1, len(non_silent_intervals)):
            next_start_raw = non_silent_intervals[i][0]
            next_end_raw = non_silent_intervals[i][1]
            
            next_start_padded = max(0, next_start_raw - int(keep_before * sr))
            next_end_padded = min(len(y), next_end_raw + int(keep_after * sr))
            
            # Max gap allowed is keep_after + keep_before (but we already padded them)
            # If they overlap or touch, merge
            if next_start_padded <= curr_end:
                curr_end = next_end_padded
            else:
                # Append current section
                processed_segments.append(y[curr_start:curr_end])
                curr_start = next_start_padded
                curr_end = next_end_padded
        
        # Append the last section
        processed_segments.append(y[curr_start:curr_end])
        
        trimmed_y = np.concatenate(processed_segments)
        
        # Convert numpy to torch tensor for torchaudio saving
        # Librosa loads as (n_samples,) so we add a channel dim (1, n_samples)
        trimmed_tensor = torch.from_numpy(trimmed_y).unsqueeze(0)
        torchaudio.save(output_path, trimmed_tensor, sr)
        
        new_duration = len(trimmed_y) / sr
        trimmed_amount = original_duration - new_duration
        
        print(f"Trimming complete. Original: {original_duration:.2f}s, New: {new_duration:.2f}s, Trimmed: {trimmed_amount:.2f}s")
        return True, original_duration, new_duration

if __name__ == "__main__":
    # Test
    processor = AudioProcessor()
    # processor.trim_silences("test.wav", "test_trimmed.wav")
