import { createContext, useContext, useRef, createElement } from 'react';
import { useLocation } from 'react-router-dom';

const NAV_ORDER = ['/home', '/sadhana', '/manan', '/drishti', '/gyaan', '/settings'];

const NavDirectionContext = createContext('forward');

export function useNavDirection() {
  return useContext(NavDirectionContext);
}

export function NavDirectionProvider({ children }) {
  const location  = useLocation();
  const prevRef   = useRef(location.pathname);
  const dirRef    = useRef('forward');

  const prev = prevRef.current;
  const curr = location.pathname;
  if (prev !== curr) {
    const pi = NAV_ORDER.indexOf(prev);
    const ci = NAV_ORDER.indexOf(curr);
    if (pi !== -1 && ci !== -1) {
      dirRef.current = ci > pi ? 'forward' : 'backward';
    }
    prevRef.current = curr;
  }

  return createElement(NavDirectionContext.Provider, { value: dirRef.current }, children);
}
