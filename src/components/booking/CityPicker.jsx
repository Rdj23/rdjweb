import React, { useState } from "react";
import Modal from "../ui/Modal";
import { CITIES } from "../../lib/venues";
import { useBooking } from "../../context/booking-context";
import { IconPin, IconChevronDown, IconCheck } from "../ui/Icons";

export default function CityPicker({ compact = false }) {
  const { city, setCity } = useBooking();
  const [open, setOpen] = useState(false);
  const current = CITIES.find((c) => c.id === city) || CITIES[0];

  const choose = (next) => {
    setCity(next.id, next.name);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-200 transition-colors hover:bg-ink-800 hover:text-white"
        aria-label={`Change city, currently ${current.name}`}
      >
        <IconPin size={16} className="text-brand-400" />
        {!compact && <span className="hidden sm:inline">{current.name}</span>}
        <IconChevronDown size={14} className="text-ink-400" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Select your city">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CITIES.map((option) => {
            const selected = option.id === current.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => choose(option)}
                aria-pressed={selected}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                  selected
                    ? "border-brand-400 bg-brand-400/10 text-brand-300"
                    : "border-ink-700 bg-ink-800 text-ink-200 hover:border-ink-500 hover:text-white"
                }`}
              >
                {option.name}
                {selected && <IconCheck size={16} />}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-ink-400">
          Showtimes, cinemas and ticket prices all follow your selected city.
        </p>
      </Modal>
    </>
  );
}
