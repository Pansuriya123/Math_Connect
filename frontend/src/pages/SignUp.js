import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useToast } from '../components/ToastProvider';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Removed full name from signup flow
  const [imageBase64, setImageBase64] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const symbols = ['∑', '∫', '∏', '√', 'π', '∞'];
    const particles = [];

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 30 + 15;
        this.symbol = symbols[Math.floor(Math.random() * symbols.length)];
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        ctx.fillStyle = 'rgba(74, 144, 226, 0.5)';
        ctx.font = `${this.size}px Arial`;
        ctx.fillText(this.symbol, this.x, this.y);
      }
    }

    for (let i = 0; i < 20; i++) { // Reduced from 50 to 20 particles
      particles.push(new Particle());
    }

    let animationId;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      animationId = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  useEffect(() => {
    const animateForm = (form, delay) => {
      setTimeout(() => {
        form.style.opacity = '1';
        form.style.transform = 'translateY(0)';
      }, delay);
    };

    animateForm(formRef.current, 300);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB. Please choose a smaller image.');
        return;
      }

      reader.readAsDataURL(file);
      reader.onloadend = () => {
        // Compress image if it's too large
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 300x300)
          let { width, height } = img;
          const maxSize = 300;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with reduced quality
          const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
          setImageBase64(compressedImage);
          setPreviewPhoto(compressedImage);
        };
        img.src = reader.result;
      };
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const userData = {
      username,
      email,
      password,
      profile_photo: imageBase64,
    };

    try {
      const response = await axiosInstance.post(
        '/api/user/signup',
        userData,
        { 
          timeout: 100000 // 10 second timeout
        }
      );
      toast.success(response.data.message || 'Signup successful!');
      navigate('/login');
    } catch (error) {
      console.error('Full error object:', error);
      
      if (error.code === 'ECONNABORTED') {
        toast.warn('Request timed out. Please check your internet connection and try again.');
      } else if (error.response?.status === 422) {
        const errorMessage = error.response?.data?.errors || error.response?.data?.message;
        toast.error(errorMessage || 'Invalid input data. Please check your information.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else if (!error.response) {
        toast.error('Network error. Please check your internet connection.');
      } else {
        const errorMessage = error.response?.data?.errors || error.response?.data?.message || error.message;
        toast.error(errorMessage || 'Signup failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas}></canvas>
      <div style={styles.content}>
        <form ref={formRef} onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>Sign Up</h2>
          <div style={styles.photoContainer} onClick={handlePhotoClick}>
            {previewPhoto ? (
              <img src={previewPhoto} alt="Profile" style={styles.photoPreview} />
            ) : (
              <div style={styles.photoPlaceholder}>
                <span style={styles.photoPlaceholderText}>Add Photo</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleImageUpload}
            accept="image/*"
            style={styles.hiddenFileInput}
          />
          <div style={styles.inputGroup}>
            <label htmlFor="username" style={styles.label}>Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          {/* Full name removed from signup form */}
          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </button>
          <div style={styles.links}>
            <Link to="/login" style={styles.link}>Already have an account? Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#f0f8ff',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: '5px 40px 10px 40px',
    borderRadius: '10px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    width: '300px',
    opacity: '0',
    transform: 'translateY(20px)',
    transition: 'all 0.3s ease',
  },
  title: {
    fontSize: '2.5rem',
    color: '#333',
    marginBottom: '1.0rem',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
  },
  photoContainer: {
    width: '120px',
    height: '120px',
    margin: '0 auto 20px',
    cursor: 'pointer',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: '#757575',
    fontSize: '0.9rem',
  },
  hiddenFileInput: {
    display: 'none',
  },
  inputGroup: {
    marginBottom: '10px',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '0.9rem',
    color: '#666',
  },
  input: {
    width: '90%',
    padding: '12px',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1) inset',
    outline: 'none',
    transition: 'border-color 0.3s ease',
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#4a90e2',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  links: {
    marginTop: '10px',
    display: 'flex',
    justifyContent: 'center',
  },
  link: {
    color: '#4a90e2',
    textDecoration: 'none',
    fontSize: '1rem',
    transition: 'color 0.3s ease',
  },
};

export default SignUp;