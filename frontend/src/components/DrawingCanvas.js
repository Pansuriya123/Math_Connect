import React, { useEffect, useRef, useState } from 'react';
import './DrawingCanvas.css';

const DrawingCanvas = ({ width = 600, height = 350 }) => {
  const canvasRef = useRef(null);
  const gridRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const startPointRef = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#111827');
  const [lineWidth, setLineWidth] = useState(3);
  const [textValue, setTextValue] = useState('Text');
  const [showGrid, setShowGrid] = useState(false);

  const historyRef = useRef([]);
  const redoRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    pushHistory();
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = lineWidth;
  }, [lineWidth]);

  const drawGrid = () => {
    const grid = gridRef.current;
    if (!grid) return;
    const gctx = grid.getContext('2d');
    const drawCanvas = canvasRef.current;
    const w = drawCanvas ? drawCanvas.clientWidth : 0;
    const h = drawCanvas ? drawCanvas.clientHeight : 0;
    if (w && h) {
      grid.width = w;
      grid.height = h;
      grid.style.width = `${w}px`;
      grid.style.height = `${h}px`;
    }
    gctx.clearRect(0, 0, grid.width, grid.height);
    if (!showGrid) return;
    gctx.strokeStyle = '#e5e7eb';
    gctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x <= grid.width; x += step) {
      const xpos = Math.min(x, grid.width - 0.5) + 0.5;
      gctx.beginPath();
      gctx.moveTo(xpos, 0);
      gctx.lineTo(xpos, grid.height);
      gctx.stroke();
    }
    for (let y = 0; y <= grid.height; y += step) {
      const ypos = Math.min(y, grid.height - 0.5) + 0.5;
      gctx.beginPath();
      gctx.moveTo(0, ypos);
      gctx.lineTo(grid.width, ypos);
      gctx.stroke();
    }
    gctx.beginPath();
    gctx.moveTo(0.5, 0.5);
    gctx.lineTo(grid.width - 0.5, 0.5);
    gctx.lineTo(grid.width - 0.5, grid.height - 0.5);
    gctx.lineTo(0.5, grid.height - 0.5);
    gctx.closePath();
    gctx.stroke();
  };

  useEffect(() => {
    drawGrid();
  }, [showGrid]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPos(e);
    lastPointRef.current = pos;
    startPointRef.current = pos;
    const ctx = canvasRef.current.getContext('2d');
    snapshotRef.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (tool === 'text') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = color;
      const fontSize = Math.max(12, lineWidth * 6);
      ctx.font = `${fontSize}px Arial`;
      ctx.fillText(textValue, pos.x, pos.y);
      isDrawingRef.current = false;
      pushHistory();
    }
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const current = getPos(e);

    if (tool === 'pen' || tool === 'eraser') {
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
      }
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
      lastPointRef.current = current;
      return;
    }

    if (snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startPointRef.current.x, startPointRef.current.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
    } else if (tool === 'rect') {
      const w = current.x - startPointRef.current.x;
      const h = current.y - startPointRef.current.y;
      ctx.strokeRect(startPointRef.current.x, startPointRef.current.y, w, h);
    } else if (tool === 'circle') {
      const dx = current.x - startPointRef.current.x;
      const dy = current.y - startPointRef.current.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      ctx.beginPath();
      ctx.arc(startPointRef.current.x, startPointRef.current.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    pushHistory();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pushHistory();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'practice-canvas.png';
    a.click();
  };

  const pushHistory = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    historyRef.current.push(dataUrl);
    if (historyRef.current.length > 50) historyRef.current.shift();
    redoRef.current = [];
  };

  const restoreFromDataUrl = (url) => {
    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = url;
  };

  const handleUndo = () => {
    if (historyRef.current.length <= 1) return;
    const last = historyRef.current.pop();
    redoRef.current.push(last);
    const prev = historyRef.current[historyRef.current.length - 1];
    restoreFromDataUrl(prev);
  };

  const handleRedo = () => {
    if (redoRef.current.length === 0) return;
    const next = redoRef.current.pop();
    historyRef.current.push(next);
    restoreFromDataUrl(next);
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const newWidth = Math.min(container.clientWidth, width);
      const newHeight = Math.round((newWidth / width) * height);
      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.putImageData(imageData, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      drawGrid();
    };

    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(container);
    return () => obs.disconnect();
  }, [width, height, color, lineWidth]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'g') {
        setShowGrid((s) => !s);
      } else if (e.key === 'Delete') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="drawing-canvas" ref={containerRef}>
      <div className="canvas-toolbar">
        <div className="tool-group">
          <button
            type="button"
            className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
          >
            Pen
          </button>
          <button
            type="button"
            className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
          >
            Eraser
          </button>
          <button
            type="button"
            className={`tool-btn ${tool === 'line' ? 'active' : ''}`}
            onClick={() => setTool('line')}
          >
            Line
          </button>
          <button
            type="button"
            className={`tool-btn ${tool === 'rect' ? 'active' : ''}`}
            onClick={() => setTool('rect')}
          >
            Rect
          </button>
          <button
            type="button"
            className={`tool-btn ${tool === 'circle' ? 'active' : ''}`}
            onClick={() => setTool('circle')}
          >
            Circle
          </button>
          <button
            type="button"
            className={`tool-btn ${tool === 'text' ? 'active' : ''}`}
            onClick={() => setTool('text')}
          >
            Text
          </button>
        </div>
        <div className="tool-group">
          <label className="tool-label">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <div className="tool-group">
          <label className="tool-label">Size</label>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
          />
        </div>
        {tool === 'text' && (
          <div className="tool-group">
            <label className="tool-label">Text</label>
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              className="text-input"
            />
          </div>
        )}
        <div className="tool-group right">
          <button type="button" className="tool-btn" onClick={() => setShowGrid((s) => !s)}>{showGrid ? 'Hide Grid' : 'Show Grid'}</button>
          <button type="button" className="tool-btn" onClick={handleUndo}>Undo</button>
          <button type="button" className="tool-btn" onClick={handleRedo}>Redo</button>
          <button type="button" className="tool-btn" onClick={handleClear}>Clear</button>
          <button type="button" className="tool-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
      <canvas ref={gridRef} className="grid-layer" />
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="draw-layer"
      />
    </div>
  );
};

export default DrawingCanvas;
