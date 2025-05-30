# 🌙 Dark Mode Implementation Guide

## Overview

The Anti-Corruption Portal now includes a comprehensive dark/light mode system with automatic system preference detection and manual toggle options.

## Features

### 🎯 Theme Options
- **Light Mode**: Clean, professional light theme
- **Dark Mode**: Modern dark theme optimized for low-light environments
- **System Mode**: Automatically follows user's system preference

### 🔧 Implementation Details

#### Theme Context
- **Location**: `src/contexts/ThemeContext.tsx`
- **Storage**: Preferences saved to localStorage
- **System Detection**: Automatic detection of `prefers-color-scheme`
- **Real-time Updates**: Responds to system theme changes

#### Theme Toggle Component
- **Location**: `src/components/ui/ThemeToggle.tsx`
- **Variants**: Button toggle or dropdown selector
- **Accessibility**: Full ARIA support and keyboard navigation
- **Responsive**: Touch-friendly on mobile devices

## Usage

### Basic Theme Toggle
```tsx
import ThemeToggle from '../ui/ThemeToggle';

// Simple toggle button (light/dark only)
<ThemeToggle variant="button" size="md" />

// Dropdown with all options (light/dark/system)
<ThemeToggle variant="dropdown" size="md" showLabel={true} />
```

### Using Theme Context
```tsx
import { useTheme } from '../../contexts/ThemeContext';

function MyComponent() {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Current preference: {theme}</p>
      <p>Actual theme: {actualTheme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('system')}>Use System</button>
    </div>
  );
}
```

## CSS Variables System

### Color Scheme
All colors are defined using CSS custom properties that automatically switch based on theme:

```css
:root {
  /* Light theme colors */
  --color-primary: #3b82f6;
  --bg-primary: #ffffff;
  --text-primary: #1a202c;
  --border-primary: #e2e8f0;
}

.dark {
  /* Dark theme colors */
  --color-primary: #60a5fa;
  --bg-primary: #1f2937;
  --text-primary: #f9fafb;
  --border-primary: #374151;
}
```

### Using Variables in Components
```css
.my-component {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-md);
}
```

## Component Integration

### Navbar Integration
The theme toggle is integrated into the navbar:
```tsx
// In Navbar.tsx
<ThemeToggle variant="button" size="md" />
```

### App-wide Integration
Theme provider wraps the entire application:
```tsx
// In App.tsx
<ThemeProvider>
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
</ThemeProvider>
```

## Customization

### Adding New Colors
1. Define in both light and dark themes:
```css
:root {
  --color-custom: #your-light-color;
}

.dark {
  --color-custom: #your-dark-color;
}
```

2. Use in components:
```css
.custom-element {
  color: var(--color-custom);
}
```

### Creating Theme-Aware Components
```tsx
function ThemeAwareComponent() {
  const { actualTheme } = useTheme();
  
  return (
    <div className={`component ${actualTheme === 'dark' ? 'dark-specific' : 'light-specific'}`}>
      Content adapts to theme
    </div>
  );
}
```

## Accessibility

### Features
- **High Contrast**: Optimized color ratios for readability
- **System Preference**: Respects user's system settings
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Proper ARIA labels and announcements
- **Focus Management**: Clear focus indicators

### ARIA Labels
```tsx
<button
  aria-label={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
  title="Toggle theme"
>
  {/* Theme icon */}
</button>
```

## Mobile Support

### Features
- **Touch-Friendly**: 44px minimum touch targets
- **Meta Theme Color**: Updates browser chrome color
- **Responsive**: Adapts to different screen sizes
- **Performance**: Smooth transitions on mobile devices

### Meta Tags
```html
<meta name="theme-color" content="#ffffff" />
<meta name="color-scheme" content="light dark" />
```

## Performance

### Optimizations
- **CSS Variables**: Efficient theme switching
- **Local Storage**: Persistent preferences
- **Minimal Re-renders**: Optimized React context
- **Smooth Transitions**: Hardware-accelerated animations

### Transition Timing
```css
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

## Browser Support

### Compatibility
- **Modern Browsers**: Full support (Chrome 90+, Firefox 88+, Safari 14+)
- **CSS Variables**: Native support
- **Media Queries**: `prefers-color-scheme` support
- **Local Storage**: Persistent theme preferences

## Testing

### Manual Testing
1. **Toggle Functionality**: Click theme toggle button
2. **System Preference**: Change system theme and verify auto-update
3. **Persistence**: Refresh page and verify theme is maintained
4. **Responsive**: Test on different screen sizes

### Automated Testing
```tsx
// Example test
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ui/ThemeToggle';

test('theme toggle changes theme', () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
  
  const toggleButton = screen.getByRole('button');
  // Test toggle functionality
});
```

## Troubleshooting

### Common Issues

#### Theme Not Persisting
- **Check**: localStorage permissions
- **Solution**: Ensure localStorage is available

#### Colors Not Updating
- **Check**: CSS variable usage
- **Solution**: Use `var(--variable-name)` instead of hardcoded colors

#### System Theme Not Detected
- **Check**: Browser support for `prefers-color-scheme`
- **Solution**: Provide manual fallback

### Debug Mode
```tsx
function DebugTheme() {
  const { theme, actualTheme } = useTheme();
  
  return (
    <div>
      <p>Theme Preference: {theme}</p>
      <p>Actual Theme: {actualTheme}</p>
      <p>System Preference: {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'}</p>
    </div>
  );
}
```

## Future Enhancements

### Planned Features
- **Custom Themes**: User-defined color schemes
- **High Contrast Mode**: Enhanced accessibility option
- **Automatic Scheduling**: Time-based theme switching
- **Theme Animations**: Enhanced transition effects

### API Extensions
```tsx
// Future API ideas
const { 
  theme, 
  setTheme, 
  scheduleTheme,
  customThemes,
  addCustomTheme 
} = useTheme();
```

## Best Practices

### Development
1. **Always use CSS variables** for colors
2. **Test in both themes** during development
3. **Consider accessibility** in color choices
4. **Optimize for performance** with efficient transitions

### Design
1. **Maintain contrast ratios** for readability
2. **Use semantic colors** (primary, success, danger)
3. **Test with real content** in both themes
4. **Consider user preferences** and system settings
