"use client";

import { useMemo, useState } from "react";
import { COUNTRY_OPTIONS } from "@/lib/countries";

export function CountrySelect({
  value,
  onChange,
  className,
  required = false,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  className: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className}
      required={required}
      disabled={disabled}
      autoComplete="country"
    >
      <option value="">Select your country</option>
      {COUNTRY_OPTIONS.map(({ code, name }) => (
        <option key={code} value={code}>{name}</option>
      ))}
    </select>
  );
}

export function CountryMultiSelect({
  value,
  onChange,
  className,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  className: string;
}) {
  const [search, setSearch] = useState("");
  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? COUNTRY_OPTIONS.filter(({ name, code }) => name.toLowerCase().includes(query) || code.toLowerCase() === query)
      : COUNTRY_OPTIONS;
  }, [search]);

  function toggleCountry(code: string) {
    onChange(value.includes(code) ? value.filter((item) => item !== code) : [...value, code]);
  }

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search countries…"
        aria-label="Search task target countries"
        className={className}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => toggleCountry(code)}
              className="rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-red-500/10 hover:text-red-600"
              aria-label={`Remove ${COUNTRY_OPTIONS.find((country) => country.code === code)?.name ?? code}`}
            >
              {COUNTRY_OPTIONS.find((country) => country.code === code)?.name ?? code} ×
            </button>
          ))}
        </div>
      )}
      <div className="max-h-52 overflow-y-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] p-2">
        {filteredOptions.map(({ code, name }) => (
          <label key={code} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[var(--text-primary)] hover:bg-black/5">
            <input
              type="checkbox"
              checked={value.includes(code)}
              onChange={() => toggleCountry(code)}
              className="accent-teal-600"
            />
            {name}
          </label>
        ))}
        {filteredOptions.length === 0 && <p className="px-2 py-3 text-sm text-[var(--text-muted)]">No countries found.</p>}
      </div>
    </div>
  );
}
