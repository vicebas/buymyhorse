"use client";

import Select, { components, type MultiValue, type OptionProps } from "react-select";

import { Label } from "@/components/ui/label";

export type HorseMultiSelectOption = {
  id: string;
  label: string;
  disciplineLabel?: string;
};

type SelectOption = {
  value: string;
  label: string;
  disciplineLabel?: string;
};

function CheckboxOption(props: OptionProps<SelectOption, true>) {
  const { data, isSelected, label } = props;

  return (
    <components.Option {...props}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          tabIndex={-1}
          className="mt-0.5 h-4 w-4 rounded border-[color:var(--border)] accent-[color:var(--primary)]"
        />
        <div className="min-w-0">
          <div className="font-medium text-[color:var(--foreground-strong)]">{label}</div>
          {data.disciplineLabel ? (
            <div className="mt-0.5 text-xs text-[color:var(--foreground-soft)]">{data.disciplineLabel}</div>
          ) : null}
        </div>
      </div>
    </components.Option>
  );
}

export default function HorseMultiSelect({
  label,
  name,
  options,
  selected,
  onChange,
  helperText,
  placeholder = "Select options",
  emptyMessage = "No options available yet.",
}: {
  label: string;
  name: string;
  options: HorseMultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  helperText?: string;
  placeholder?: string;
  emptyMessage?: string;
}) {
  const selectOptions: SelectOption[] = options.map((option) => ({
    value: option.id,
    label: option.label,
    disciplineLabel: option.disciplineLabel,
  }));
  const allowedIds = new Set(selectOptions.map((option) => option.value));
  const visibleSelected = selected.filter((value) => allowedIds.has(value));
  const selectedOptions = selectOptions.filter((option) => visibleSelected.includes(option.value));

  function handleChange(nextValue: MultiValue<SelectOption>) {
    onChange(nextValue.map((option) => option.value));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        {helperText ? <p className="text-xs text-[color:var(--foreground-soft)]">{helperText}</p> : null}
      </div>

      {visibleSelected.map((value) => (
        <input key={`${name}-${value}`} type="hidden" name={name} value={value} />
      ))}

      <div className="mt-3">
        <Select<SelectOption, true>
          inputId={name}
          instanceId={name}
          isMulti
          isSearchable
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          backspaceRemovesValue={false}
          options={selectOptions}
          value={selectedOptions}
          onChange={handleChange}
          placeholder={placeholder}
          noOptionsMessage={() => emptyMessage}
          components={{
            Option: CheckboxOption,
          }}
          classNamePrefix="horse-multi-select"
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: 40,
              borderRadius: 12,
              borderColor: state.isFocused ? "var(--ring)" : "var(--input)",
              backgroundColor: "var(--background-elevated)",
              boxShadow: state.isFocused ? "0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent)" : "none",
              "&:hover": {
                borderColor: state.isFocused ? "var(--ring)" : "var(--input)",
              },
            }),
            placeholder: (base) => ({
              ...base,
              color: "var(--foreground-soft)",
            }),
            input: (base) => ({
              ...base,
              color: "var(--foreground)",
            }),
            singleValue: (base) => ({
              ...base,
              color: "var(--foreground)",
            }),
            multiValue: (base) => ({
              ...base,
              borderRadius: 999,
              backgroundColor: "color-mix(in srgb, var(--accent) 14%, var(--background-elevated))",
              maxWidth: "100%",
            }),
            multiValueLabel: (base) => ({
              ...base,
              color: "var(--foreground-strong)",
              fontSize: 12,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }),
            multiValueRemove: (base) => ({
              ...base,
              color: "var(--foreground-soft)",
              ":hover": {
                backgroundColor: "transparent",
                color: "var(--foreground-strong)",
              },
            }),
            valueContainer: (base) => ({
              ...base,
              paddingInline: 12,
              paddingBlock: 6,
            }),
            menu: (base) => ({
              ...base,
              zIndex: 20,
              overflow: "hidden",
              borderRadius: 16,
              border: "1px solid var(--border)",
              backgroundColor: "var(--card)",
              boxShadow: "var(--shadow-card)",
            }),
            menuList: (base) => ({
              ...base,
              padding: 8,
            }),
            option: (base, state) => ({
              ...base,
              borderRadius: 12,
              backgroundColor: state.isSelected
                ? "color-mix(in srgb, var(--accent) 16%, var(--card))"
                : state.isFocused
                  ? "var(--muted)"
                  : "var(--card)",
              color: "var(--foreground)",
              cursor: "pointer",
              padding: 12,
            }),
            clearIndicator: (base) => ({
              ...base,
              color: "var(--foreground-soft)",
            }),
            dropdownIndicator: (base) => ({
              ...base,
              color: "var(--foreground-soft)",
            }),
            indicatorSeparator: (base) => ({
              ...base,
              backgroundColor: "var(--border)",
            }),
          }}
        />
      </div>
    </div>
  );
}
