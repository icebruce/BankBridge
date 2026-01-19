import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faPlus, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import Button from '../Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not trigger onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders icon when provided', () => {
    const { container } = render(<Button icon={faPlus}>Add</Button>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders icon on right when iconPosition="right"', () => {
    const { container } = render(
      <Button icon={faArrowRight} iconPosition="right">Next</Button>
    );
    const button = screen.getByRole('button');
    const svg = container.querySelector('svg');

    // Icon should come after text content
    expect(svg).toBeInTheDocument();
    expect(button.textContent).toBe('Next');
  });

  it('applies custom className', () => {
    render(<Button className="my-custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('my-custom-class');
  });

  it('passes through HTML button attributes', () => {
    render(<Button type="submit" name="submit-btn" aria-label="Submit form">Submit</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('name', 'submit-btn');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
  });
});
