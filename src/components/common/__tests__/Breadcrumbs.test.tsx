import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import Breadcrumbs from '../Breadcrumbs';

describe('Breadcrumbs', () => {
  const mockOnBack = vi.fn();
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders breadcrumb items with separators', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Home' },
          { label: 'Templates' },
          { label: 'Edit' }
        ]}
      />
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getAllByText('>')).toHaveLength(2);
  });

  it('shows back button and calls onBack when clicked', async () => {
    render(
      <Breadcrumbs
        items={[{ label: 'Home' }]}
        onBack={mockOnBack}
        showBackButton={true}
      />
    );

    const backButton = screen.getByRole('button');
    await userEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledOnce();
  });

  it('makes non-last items clickable and calls onNavigate', async () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Home', path: '/home' },
          { label: 'Templates', path: '/templates' },
          { label: 'Edit' }
        ]}
        onNavigate={mockOnNavigate}
      />
    );

    // Home and Templates are buttons, Edit is not
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Templates' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(mockOnNavigate).toHaveBeenCalledWith('/home');
  });

  it('renders icons when provided', () => {
    const { container } = render(
      <Breadcrumbs
        items={[
          { label: 'Home', icon: faHome },
          { label: 'Files' }
        ]}
      />
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses custom separator when provided', () => {
    render(
      <Breadcrumbs
        items={[{ label: 'Home' }, { label: 'Templates' }]}
        separator="/"
      />
    );

    expect(screen.getByText('/')).toBeInTheDocument();
  });
});
