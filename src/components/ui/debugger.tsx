import { useTheme } from '@/components/common/ThemeContext';

function ThemeDebugger() {
  const { theme, actualTheme } = useTheme();
  
  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded z-50 text-sm">
      <div>Selected: {theme}</div>
      <div>Actual: {actualTheme}</div>
      <div>HTML has dark class: {document.documentElement.classList.contains('dark') ? 'YES' : 'NO'}</div>
      <div>HTML classes: {document.documentElement.className || 'none'}</div>
    </div>
  );
}

export default ThemeDebugger;