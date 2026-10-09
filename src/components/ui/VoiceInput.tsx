"use client";

import { useState, useRef, useEffect } from "react";
import { IconMic } from "@/components/icons";

interface VoiceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function VoiceInput({ value, onChange, type = "text", ...props }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<"ur-PK" | "en-US">("ur-PK");
  const [hasPermission, setHasPermission] = useState(true);
  const [supportsVoice, setSupportsVoice] = useState(true);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Skip voice for password fields
  const skipVoice = type === "password";

  useEffect(() => {
    if (typeof window === "undefined" || skipVoice) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupportsVoice(false);
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setHasPermission(true);
    };

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      if (inputRef.current) {
        const currentValue = inputRef.current.value || "";
        const newValue = currentValue + transcript;
        inputRef.current.value = newValue;

        if (onChange) {
          const evt = new Event('change', { bubbles: true });
          Object.defineProperty(evt, 'target', { value: inputRef.current, enumerable: true });
          onChange(evt as any);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setHasPermission(false);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [language, skipVoice, onChange]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
    }
  };

  if (skipVoice || !supportsVoice) {
    return <input ref={inputRef} type={type} value={value} onChange={onChange} {...props} />;
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        {...props}
        className={`w-full rounded-lg border border-border-subtle px-3.5 py-2.5 pr-14 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${props.className || ""}`}
      />

      <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {!hasPermission && (
          <span className="text-xs text-rose-600" title="Microphone permission denied">
            ⚠
          </span>
        )}

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as "ur-PK" | "en-US")}
          className="rounded border border-border-subtle bg-white px-1.5 py-0.5 text-xs font-medium text-ink-secondary hover:bg-surface-2 dark:bg-slate-900"
        >
          <option value="ur-PK">اردو</option>
          <option value="en-US">English</option>
        </select>

        <button
          type="button"
          onClick={toggleListening}
          className={`rounded-lg p-2 transition ${
            isListening
              ? "animate-pulse bg-rose-500 text-white"
              : "text-ink-muted hover:bg-surface-3 hover:text-ink-primary"
          }`}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          <IconMic size={16} />
        </button>
      </div>
    </div>
  );
}
