import tempfile
import os
from moviepy.editor import VideoFileClip

MAX_DURATION_SECONDS = 30


def trim_video_to_duration(video_content: bytes, max_duration: int = MAX_DURATION_SECONDS) -> bytes:
    """
    Trim a video to the specified maximum duration (in seconds).
    Returns the trimmed video as bytes.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        input_path = os.path.join(temp_dir, "input.mp4")
        output_path = os.path.join(temp_dir, "output.mp4")
        
        with open(input_path, "wb") as f:
            f.write(video_content)
        
        with VideoFileClip(input_path) as video:
            if video.duration <= max_duration:
                return video_content
            
            trimmed = video.subclip(0, max_duration)
            trimmed.write_videofile(
                output_path,
                codec="libx264",
                audio_codec="aac",
                temp_audiofile=os.path.join(temp_dir, "temp-audio.m4a"),
                remove_temp=True,
                logger=None,
            )
        
        with open(output_path, "rb") as f:
            return f.read()


def get_video_duration(video_content: bytes) -> float:
    """Get the duration of a video in seconds."""
    with tempfile.TemporaryDirectory() as temp_dir:
        input_path = os.path.join(temp_dir, "input.mp4")
        
        with open(input_path, "wb") as f:
            f.write(video_content)
        
        with VideoFileClip(input_path) as video:
            return video.duration
