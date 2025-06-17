import { useState, useRef, useEffect, useCallback } from 'react';

export const useWebRTC = () => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState({ cameras: [], microphones: [] });
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Get available media devices
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      const microphones = devices.filter(device => device.kind === 'audioinput');
      
      setDevices({ cameras, microphones });
      
      // Set default devices
      if (cameras.length > 0 && !selectedCamera) {
        setSelectedCamera(cameras[0].deviceId);
      }
      if (microphones.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(microphones[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting devices:', err);
      setError('Failed to get media devices');
    }
  }, [selectedCamera, selectedMicrophone]);

  // Start video stream
  const startVideo = useCallback(async () => {
    try {
      setError(null);
      
      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      
      return stream;
    } catch (err) {
      console.error('Error starting video:', err);
      setError('Failed to access camera/microphone. Please check permissions.');
      throw err;
    }
  }, [selectedCamera, selectedMicrophone]);

  // Stop video stream
  const stopVideo = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (!streamRef.current) {
        await startVideo();
      }

      if (!streamRef.current) {
        throw new Error('No media stream available');
      }

      // Reset recorded chunks
      recordedChunksRef.current = [];

      // Create MediaRecorder with optimal settings
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: 128000   // 128 kbps
      };

      // Fallback to supported mime types
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          options.mimeType = 'video/webm;codecs=vp8,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          options.mimeType = 'video/webm';
        } else {
          options.mimeType = 'video/mp4';
        }
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('Recording stopped, chunks:', recordedChunksRef.current.length);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('Recording started with mime type:', options.mimeType);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
      throw err;
    }
  }, [startVideo]);

  // Stop recording
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, {
            type: mediaRecorderRef.current.mimeType || 'video/webm'
          });
          
          console.log('Recording blob created:', blob.size, 'bytes');
          resolve(blob);
        };

        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }

      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    });
  }, [isRecording]);

  // Get recording blob
  const getRecordingBlob = useCallback(() => {
    if (recordedChunksRef.current.length > 0) {
      return new Blob(recordedChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || 'video/webm'
      });
    }
    return null;
  }, []);

  // Download recording
  const downloadRecording = useCallback(() => {
    const blob = getRecordingBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [getRecordingBlob]);

  // Upload recording to server
  const uploadRecording = useCallback(async (sessionId, questionId) => {
    const blob = getRecordingBlob();
    if (!blob) {
      throw new Error('No recording available');
    }

    const formData = new FormData();
    formData.append('recording', blob, `recording-${sessionId}-${questionId}-${Date.now()}.webm`);
    formData.append('session_id', sessionId);
    formData.append('question_id', questionId || '');
    formData.append('recording_type', 'video');
    formData.append('duration', recordingDuration.toString());

    try {
      const response = await fetch('/api/interview/upload-recording', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Recording uploaded successfully:', result);
      return result;
    } catch (err) {
      console.error('Error uploading recording:', err);
      throw err;
    }
  }, [getRecordingBlob, recordingDuration]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(prev => !prev);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(prev => !prev);
    }
  }, []);

  // Format duration
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideo();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [stopVideo]);

  // Initialize devices
  useEffect(() => {
    getDevices();
  }, [getDevices]);

  return {
    // State
    isVideoEnabled,
    isAudioEnabled,
    isRecording,
    recordingDuration,
    error,
    devices,
    selectedCamera,
    selectedMicrophone,

    // Refs
    videoRef,
    stream: streamRef.current,

    // Actions
    startVideo,
    stopVideo,
    startRecording,
    stopRecording,
    toggleAudio,
    toggleVideo,
    downloadRecording,
    uploadRecording,
    getRecordingBlob,
    setSelectedCamera,
    setSelectedMicrophone,
    getDevices,

    // Utilities
    formatDuration: formatDuration(recordingDuration),
    hasRecording: recordedChunksRef.current.length > 0
  };
};

