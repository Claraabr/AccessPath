import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { Stars } from './Stars.jsx';

it('shows 4 full stars and 1 empty for a 4.2 rating', () => {
  render(<Stars value={4.2} />);
  const stars = screen.getByLabelText('4.2 out of 5');
  expect(stars).toHaveTextContent('★★★★☆');
});
