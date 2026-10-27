import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('R15-02 exposes unavailable assistant as a disabled button with explanation',()=>{
  window.history.replaceState({},'', '/'); vi.spyOn(window,'scrollTo').mockImplementation(()=>{}); render(<App/>);
  const button=screen.getByRole('button',{name:'学习助手 · 暂未开放'}); expect(button).toBeDisabled(); expect(button).toHaveAccessibleDescription('学习助手暂未开放，敬请期待。'); fireEvent.click(button); expect(window.location.pathname).toBe('/'); button.focus(); expect(document.activeElement).not.toBe(button);
});
