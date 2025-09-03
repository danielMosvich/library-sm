import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { useTheme } from "../hooks/useTheme";

export default function ThemeControler() {
  const { currentTheme, setTheme, themes } = useTheme();

  return (
    <Listbox value={currentTheme} onChange={setTheme}>
      <ListboxButton className="btn flex items-center gap-2">
        {currentTheme.name}
        <svg
          width="12px"
          height="12px"
          className="inline-block h-2 w-2 fill-current opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </ListboxButton>

      <ListboxOptions
        anchor="top end"
        className="bg-base-300 rounded-box z-50 w-52 p-1 shadow-2xl border border-base-content/20 mt-2"
      >
        {themes.map((theme) => (
          <ListboxOption
            key={theme.id}
            value={theme}
            className="flex items-center gap-3 p-2 rounded-field cursor-pointer data-[focus]:bg-base-100  data-[selected]:bg-primary data-[selected]:text-primary-content "
          >
            {/* Theme color preview */}
            <div
              data-theme={theme.id}
              className="bg-base-100 p-2 grid shrink-0 grid-cols-2 gap-0.5 rounded-md shadow-sm"
            >
              <div className="bg-base-content size-1 rounded-full"></div>
              <div className="bg-primary size-1 rounded-full"></div>
              <div className="bg-secondary size-1 rounded-full"></div>
              <div className="bg-accent size-1 rounded-full"></div>
            </div>

            {/* Theme name */}
            <span className="flex-1">{theme.name}</span>

            {/* Selected indicator */}
            <div className="data-[selected]:block hidden">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
