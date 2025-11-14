export function Footer() {
  return (
    <footer className="mt-16 flex flex-col items-center gap-2 border-t border-white/5 py-6 text-xs text-textSecondary/80">
      <p>StarGazer © {new Date().getFullYear()}</p>
      <p>
        Built with React, TypeScript, Tailwind CSS, and the @react-google-maps/api library. Data provided by the StarGazer
        Flask/Skyfield backend.
      </p>
    </footer>
  );
}
