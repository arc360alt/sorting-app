import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Settings } from 'lucide-react';

const SortingVisualizer = () => {
  const [array, setArray] = useState([]);
  const [arraySize, setArraySize] = useState(() => {
    const saved = localStorage.getItem('sortingArraySize');
    return saved ? parseInt(saved) : 50;
  });
  const [algorithm, setAlgorithm] = useState(() => {
    return localStorage.getItem('sortingAlgorithm') || 'bubble';
  });
  const [sorting, setSorting] = useState(false);
  const [speed, setSpeed] = useState(() => {
    const saved = localStorage.getItem('sortingSpeed');
    return saved ? parseInt(saved) : 10;
  });
  const [comparing, setComparing] = useState([]);
  const [sorted, setSorted] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const audioContextRef = useRef(null);
  const stopSortingRef = useRef(false);

  useEffect(() => {
    generateArray();
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }, []);

  useEffect(() => {
    generateArray();
  }, [arraySize]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sortingArraySize', arraySize.toString());
  }, [arraySize]);

  useEffect(() => {
    localStorage.setItem('sortingAlgorithm', algorithm);
  }, [algorithm]);

  useEffect(() => {
    localStorage.setItem('sortingSpeed', speed.toString());
  }, [speed]);

  const generateArray = () => {
    const newArray = [];
    for (let i = 0; i < arraySize; i++) {
      newArray.push(i + 1);
    }
    // Shuffle the array
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    setArray(newArray);
    setComparing([]);
    setSorted([]);
  };

  const playNote = (frequency) => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const stopSort = () => {
    stopSortingRef.current = true;
    setSorting(false);
    setComparing([]);
  };

  const getDelay = () => {
    // Ensure minimum delay so comparisons are visible even at high speeds
    return Math.max(20, 1000 / speed);
  };

  const bubbleSort = async () => {
    const arr = [...array];
    const n = arr.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (stopSortingRef.current) return;
        
        setComparing([j, j + 1]);
        playNote(200 + (arr[j] / arraySize) * 800);
        await sleep(getDelay());
        
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);
        }
      }
    }
    setComparing([]);
  };

  const quickSort = async () => {
    const arr = [...array];
    
    const partition = async (low, high) => {
      const pivot = arr[high];
      let i = low - 1;
      
      for (let j = low; j < high; j++) {
        if (stopSortingRef.current) return -1;
        
        setComparing([j, high]);
        playNote(200 + (arr[j] / arraySize) * 800);
        await sleep(getDelay());
        
        if (arr[j] < pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          setArray([...arr]);
        }
      }
      
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      setArray([...arr]);
      return i + 1;
    };
    
    const quickSortHelper = async (low, high) => {
      if (stopSortingRef.current) return;
      
      if (low < high) {
        const pi = await partition(low, high);
        if (pi === -1) return;
        await quickSortHelper(low, pi - 1);
        await quickSortHelper(pi + 1, high);
      }
    };
    
    await quickSortHelper(0, arr.length - 1);
    setComparing([]);
  };

  const insertionSort = async () => {
    const arr = [...array];
    const n = arr.length;
    
    for (let i = 1; i < n; i++) {
      if (stopSortingRef.current) return;
      
      const key = arr[i];
      let j = i - 1;
      
      setComparing([i]);
      playNote(200 + (key / arraySize) * 800);
      await sleep(getDelay());
      
      while (j >= 0 && arr[j] > key) {
        if (stopSortingRef.current) return;
        
        setComparing([j, j + 1]);
        playNote(200 + (arr[j] / arraySize) * 800);
        arr[j + 1] = arr[j];
        setArray([...arr]);
        await sleep(getDelay());
        j--;
      }
      
      arr[j + 1] = key;
      setArray([...arr]);
    }
    setComparing([]);
  };

  const bogoSort = async () => {
    const arr = [...array];
    const n = arr.length;
    
    const isSorted = (array) => {
      for (let i = 1; i < array.length; i++) {
        if (array[i - 1] > array[i]) return false;
      }
      return true;
    };
    
    const shuffle = async (array) => {
      const newArr = [...array];
      for (let i = newArr.length - 1; i > 0; i--) {
        if (stopSortingRef.current) return newArr;
        
         const j = Math.floor(Math.random() * (i + 1));
        setComparing([i, j]);
        playNote(200 + (newArr[i] / arraySize) * 800);
        await sleep(getDelay() / 50); // add a custom delay for bogo so it goes faster
        
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    };
    
    let shuffledArr = arr;
    let attempts = 0;
    
    while (!isSorted(shuffledArr)) {
      if (stopSortingRef.current) return;
      
      shuffledArr = await shuffle(shuffledArr);
      setArray([...shuffledArr]);
      attempts++;
      
      // Safety check - stop after 10000 attempts (for large arrays)
      if (attempts > 10000) {
        alert('BogoSort is taking too long! Try a smaller array size.');
        stopSort();
        return;
      }
    }
    
    setComparing([]);
  };

  const celebrationAnimation = async () => {
    setSorted([]); // Clear any sorted bars from during the sort
    for (let i = 0; i < array.length; i++) {
      if (stopSortingRef.current) return;
      setSorted([i]); // Only highlight the current bar
      playNote(400 + (i / array.length) * 600);
      await sleep(30);
    }
    // At the very end, mark all as sorted
    setSorted(Array.from({ length: array.length }, (_, i) => i));
  };

  const startSort = async () => {
    setSorting(true);
    setSorted([]);
    setComparing([]);
    stopSortingRef.current = false;
    
    if (algorithm === 'bubble') {
      await bubbleSort();
    } else if (algorithm === 'quick') {
      await quickSort();
    } else if (algorithm === 'insertion') {
      await insertionSort();
    } else if (algorithm === 'bogo') {
      await bogoSort();
    }
    
    if (!stopSortingRef.current) {
      await celebrationAnimation();
    }
    setSorting(false);
  };
  const maxHeight = 400;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10 mb-6">
          <h1 className="text-5xl font-bold text-white mb-2 text-center bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Sorting Visualizer
          </h1>
          <p className="text-gray-400 text-center mb-8">Random app ive made becuase I am board</p>
          
          <div className="flex flex-wrap gap-4 justify-center items-center mb-8">
            <button
              onClick={startSort}
              disabled={sorting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-2xl font-semibold transition-all shadow-lg hover:shadow-blue-500/50 disabled:cursor-not-allowed"
            >
              <Play size={20} />
              Start Sort
            </button>
            
            <button
              onClick={stopSort}
              disabled={!sorting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-2xl font-semibold transition-all shadow-lg hover:shadow-red-500/50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
              Stop
            </button>
            
            <button
              onClick={generateArray}
              disabled={sorting}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white rounded-2xl font-semibold transition-all backdrop-blur-sm border border-white/10 disabled:cursor-not-allowed"
            >
              <RotateCcw size={20} />
              Reset
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              disabled={sorting}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white rounded-2xl font-semibold transition-all backdrop-blur-sm border border-white/10 disabled:cursor-not-allowed"
            >
              <Settings size={20} />
              Settings
            </button>
          </div>

          {showSettings && (
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 mb-8 border border-white/10 space-y-6">
            <div>
              <label className="block text-white font-semibold mb-3">Algorithm</label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: 'bubble', label: 'Bubble Sort' },
                  { value: 'quick', label: 'Quick Sort' },
                  { value: 'insertion', label: 'Insertion Sort' },
                  { value: 'bogo', label: 'Bogo Sort' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setAlgorithm(value)}
                    disabled={sorting}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      algorithm === value
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    } disabled:cursor-not-allowed`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

              <div>
                <label className="block text-white font-semibold mb-3">
                  Array Size: <span className="text-purple-400">{arraySize}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="150"
                  value={arraySize}
                  onChange={(e) => setArraySize(Number(e.target.value))}
                  disabled={sorting}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer bg-white/10 accent-purple-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-3">
                  Speed: <span className="text-purple-400">{speed}x</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  disabled={sorting}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer bg-white/10 accent-purple-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
          <div className="flex items-end justify-center gap-1" style={{ height: '450px' }}>
            {array.map((value, idx) => {
              const height = (value / arraySize) * maxHeight;
              const isComparing = comparing.includes(idx);
              const isSorted = sorted.includes(idx);
              
              return (
                <div
                  key={idx}
                  className="transition-all duration-75 rounded-t-lg"
                  style={{
                    height: `${height}px`,
                    width: `${Math.max(100 / arraySize, 2)}%`,
                    backgroundColor: isSorted
                      ? '#10b981'
                      : isComparing
                      ? '#f59e0b'
                      : '#8b5cf6',
                    boxShadow: isSorted
                      ? '0 0 20px rgba(16, 185, 129, 0.6)'
                      : isComparing
                      ? '0 0 20px rgba(245, 158, 11, 0.6)'
                      : '0 0 10px rgba(139, 92, 246, 0.4)',
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>🎵 Audio feedback enabled • 🎨 {arraySize} bars • ⚡ {speed}x speed</p>
        </div>
      </div>
    </div>
  );
};

export default SortingVisualizer;