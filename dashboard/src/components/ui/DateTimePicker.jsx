import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  setHours, 
  setMinutes,
  isValid,
  parseISO
} from "date-fns";
import "./DateTimePicker.css";

export default function DateTimePicker({ 
  value, 
  onChange, 
  label = "Select Date & Time",
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); // For calendar navigation
  const [selectedDate, setSelectedDate] = useState(null);
  const containerRef = useRef(null);

  // Initialize from value
  useEffect(() => {
    if (value && isValid(parseISO(value))) {
      const date = parseISO(value);
      setSelectedDate(date);
      setViewDate(date);
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calendar Logic
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Time Logic
  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10...
  const periods = ["AM", "PM"];

  const getAmPm = (date) => (date.getHours() >= 12 ? "PM" : "AM");
  const get12Hour = (date) => {
    const h = date.getHours();
    return h === 0 ? 12 : h > 12 ? h - 12 : h;
  };

  const handleDateSelect = (day) => {
    let newDate = new Date(day);
    // Preserve time if already selected
    if (selectedDate) {
      newDate = setHours(newDate, selectedDate.getHours());
      newDate = setMinutes(newDate, selectedDate.getMinutes());
    } else {
      // Default to 12:00 PM
      newDate = setHours(newDate, 12);
      newDate = setMinutes(newDate, 0);
    }
    onChange(newDate.toISOString());
    setSelectedDate(newDate);
  };

  const handleTimeChange = (type, val) => {
    if (!selectedDate) return;
    let newDate = new Date(selectedDate);
    
    if (type === "hour") {
      const currentPm = getAmPm(newDate) === "PM";
      let h = val;
      if (currentPm && h !== 12) h += 12;
      if (!currentPm && h === 12) h = 0;
      newDate = setHours(newDate, h);
    } else if (type === "minute") {
      newDate = setMinutes(newDate, val);
    } else if (type === "period") {
      const currentH = newDate.getHours();
      if (val === "AM" && currentH >= 12) newDate = setHours(newDate, currentH - 12);
      if (val === "PM" && currentH < 12) newDate = setHours(newDate, currentH + 12);
    }
    onChange(newDate.toISOString());
    setSelectedDate(newDate);
  };

  const clearDate = (e) => {
      e.stopPropagation();
      onChange("");
      setSelectedDate(null);
  };

  return (
    <div className={`datetime-picker-container ${className}`} ref={containerRef}>
      {/* Trigger */}
      <div 
        className={`datetime-trigger ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
         <CalendarIcon size={18} className="trigger-icon" />
         <div className="trigger-content">
             {selectedDate ? (
                 <span className="selected-value">
                     {format(selectedDate, "MMM dd, yyyy")} 
                     <span className="time-part">{format(selectedDate, "hh:mm a")}</span>
                 </span>
             ) : (
                 <span className="placeholder">dd-mm-yyyy --:-- --</span>
             )}
         </div>
         {selectedDate && (
             <div className="clear-btn" onClick={clearDate}>
                 <X size={14} />
             </div>
         )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="datetime-dropdown glass"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="datetime-layout">
                {/* Calendar Section */}
                <div className="calendar-section">
                    <div className="calendar-header">
                        <button type="button" onClick={() => setViewDate(subMonths(viewDate, 1))}>
                            <ChevronLeft size={16} />
                        </button>
                        <span className="current-month">{format(viewDate, "MMMM yyyy")}</span>
                        <button type="button" onClick={() => setViewDate(addMonths(viewDate, 1))}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    
                    <div className="calendar-grid">
                        {weekDays.map(d => <div key={d} className="weekday">{d}</div>)}
                        {calendarDays.map((day, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`day-btn 
                                    ${!isSameMonth(day, viewDate) ? 'other-month' : ''}
                                    ${selectedDate && isSameDay(day, selectedDate) ? 'selected' : ''}
                                `}
                                onClick={() => handleDateSelect(day)}
                            >
                                {format(day, "d")}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="datetime-divider"></div>

                {/* Time Section */}
                <div className="time-section">
                    <div className="time-header">
                        <Clock size={14} /> Time
                    </div>
                    <div className="time-columns">
                        {/* Hours */}
                        <div className="time-column">
                            {hours.map(h => (
                                <button 
                                    key={h}
                                    type="button" 
                                    className={`time-btn ${selectedDate && get12Hour(selectedDate) === h ? 'selected' : ''}`}
                                    onClick={() => handleTimeChange("hour", h)}
                                    disabled={!selectedDate}
                                >
                                    {h.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                        {/* Minutes */}
                        <div className="time-column">
                            {minutes.map(m => (
                                <button 
                                    key={m}
                                    type="button" 
                                    className={`time-btn ${selectedDate && selectedDate.getMinutes() === m ? 'selected' : ''}`}
                                    onClick={() => handleTimeChange("minute", m)}
                                    disabled={!selectedDate}
                                >
                                    {m.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                         {/* AM/PM */}
                         <div className="time-column ampm">
                            {periods.map(p => (
                                <button 
                                    key={p} 
                                    type="button"
                                    className={`time-btn ${selectedDate && getAmPm(selectedDate) === p ? 'selected' : ''}`}
                                    onClick={() => handleTimeChange("period", p)}
                                    disabled={!selectedDate}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="datetime-footer">
                <button type="button" className="footer-btn" onClick={() => {
                    const now = new Date();
                    onChange(now.toISOString());
                    setSelectedDate(now);
                    setViewDate(now);
                }}>
                    Now
                </button>
                <div className="flex-spacer"></div>
                 <button type="button" className="footer-btn primary" onClick={() => setIsOpen(false)}>
                    Done
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
