import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page', () => {
  render(<App />);
  const headingElement = screen.getByText(/college attendance login/i);
  expect(headingElement).toBeInTheDocument();
});
