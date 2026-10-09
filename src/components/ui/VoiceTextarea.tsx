"use client";

import { useState, useRef, useEffect } from "react";
import { IconPhone } from "@/components/icons";

interface VoiceTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function VoiceTextarea({ value, onChange, ...props }: VoiceTextareaProps) {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<"ur-PK" | "en-US">("ur-PK");
  const [hasPermission, setHasPermission] = useState(true);
  const [supportsVoice, setSupportsVoice] = useState(true);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userStoppedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupportsVoice(false);
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setHasPermission(true);
      userStoppedRef.current = false;
    };

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + " ";
      }

      if (textareaRef.current && transcript.trim()) {
        const currentValue = textareaRef.current.value || "";
        const newValue = currentValue + transcript;
        textareaRef.current.value = newValue;

        if (onChange) {
          const evt = new Event('change', { bubbles: true });
          Object.defineProperty(evt, 'target', { value: textareaRef.current, enumerable: true });
          onChange(evt as any);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setHasPermission(false);
        setIsListening(false);
        userStoppedRef.current = true;
      }
    };

    recognition.onend = () => {
      if (!userStoppedRef.current && isListening) {
        setTimeout(() => {
          if (!userStoppedRef.current) {
            recognitionRef.current?.start();
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    return () => {
      userStoppedRef.current = true;
      if (recognition) {
        recognition.abort();
      }
    };
  }, [language, onChange]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      userStoppedRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      userStoppedRef.current = false;
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
    }
  };

  const handleBlur = () => {
    if (isListening) {
      userStoppedRef.current = true;
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  };

  if (!supportsVoice) {
    return <textarea ref={textareaRef} value={value} onChange={onChange} {...props} />;
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          {...props}
          className={`w-full rounded-lg border border-border-subtle px-3.5 py-2.5 pr-12 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${props.className || ""}`}
        />

        <div className="absolute right-2 top-2">
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
            <IconPhone size={16} />
          </button>
        </div>
      </div>

      {isListening && (
        <div className="flex items-center gap-2 px-3.5 py-1.5">
          <div className="flex h-2 w-2 items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <span className="text-xs font-medium text-rose-600">
            Listening... tap to stop / سن رہا ہے... روکنے کے لیے دبائیں
          </span>
        </div>
      )}

      {!hasPermission && (
        <span className="text-xs text-rose-600" title="Microphone permission denied">
          ⚠ Microphone permission denied
        </span>
      )}

      <div className="flex items-center gap-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as "ur-PK" | "en-US")}
          className="rounded border border-border-subtle bg-white px-2 py-1.5 text-xs font-medium text-ink-secondary hover:bg-surface-2 dark:bg-slate-900"
        >
          <option value="ur-PK">اردو</option>
          <option value="en-US">English</option>
        </select>
      </div>
    </div>
  );
}
