import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardLayout from '../DashboardLayout';
import SidebarMenu from '../SidebarMenu';

describe('DashboardLayout', () => {
  it('should render sidebar content', () => {
    render(
      <DashboardLayout
        sidebar={<div>Sidebar Content</div>}
      >
        <div>Main Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
  });

  it('should render main content', () => {
    render(
      <DashboardLayout
        sidebar={<div>Sidebar Content</div>}
      >
        <div>Main Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });

  it('should render sticky bar when provided', () => {
    render(
      <DashboardLayout
        sidebar={<div>Sidebar</div>}
        stickyBar={<div>Sticky Bar Content</div>}
      >
        <div>Main</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Sticky Bar Content')).toBeInTheDocument();
  });

  it('should not render sticky bar when not provided', () => {
    render(
      <DashboardLayout
        sidebar={<div>Sidebar</div>}
      >
        <div>Main</div>
      </DashboardLayout>
    );

    expect(screen.queryByText('Sticky Bar Content')).not.toBeInTheDocument();
  });

  it('should apply correct layout classes', () => {
    const { container } = render(
      <DashboardLayout
        sidebar={<div>Sidebar</div>}
      >
        <div>Main</div>
      </DashboardLayout>
    );

    const layoutDiv = container.firstChild as HTMLElement;
    expect(layoutDiv.className).toContain('flex');
    expect(layoutDiv.className).toContain('min-h-screen');
  });

  it('should have fixed width sidebar container', () => {
    const { container } = render(
      <DashboardLayout
        sidebar={<div>Sidebar</div>}
      >
        <div>Main</div>
      </DashboardLayout>
    );

    const sidebarContainer = container.querySelector('.w-72');
    expect(sidebarContainer).toBeInTheDocument();
  });
});

describe('SidebarMenu', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render app title', () => {
    render(<SidebarMenu active="Settings" onSelect={mockOnSelect} />);

    expect(screen.getByText('CSV Processor')).toBeInTheDocument();
  });

  it('should render all navigation items', () => {
    render(<SidebarMenu active="Settings" onSelect={mockOnSelect} />);

    expect(screen.getByText('Process Files')).toBeInTheDocument();
    expect(screen.getByText('Import Templates')).toBeInTheDocument();
    expect(screen.getByText('Export Templates')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should highlight active item', () => {
    render(<SidebarMenu active="Settings" onSelect={mockOnSelect} />);

    const settingsButton = screen.getByText('Settings').closest('button');
    expect(settingsButton?.className).toContain('bg-neutral-100');
    expect(settingsButton?.className).toContain('text-neutral-900');
  });

  it('should not highlight inactive items', () => {
    render(<SidebarMenu active="Settings" onSelect={mockOnSelect} />);

    const processFilesButton = screen.getByText('Process Files').closest('button');
    expect(processFilesButton?.className).toContain('text-neutral-600');
    expect(processFilesButton?.className).not.toContain('bg-neutral-100');
  });

  it('should call onSelect when item is clicked', async () => {
    const user = userEvent.setup();
    render(<SidebarMenu active="Settings" onSelect={mockOnSelect} />);

    await user.click(screen.getByText('Import Templates'));

    expect(mockOnSelect).toHaveBeenCalledWith('Import Templates');
  });

  it('should call onSelect with correct item name for each nav item', async () => {
    const user = userEvent.setup();
    render(<SidebarMenu active="Settings" onSelect={mockOnSelect} />);

    await user.click(screen.getByText('Process Files'));
    expect(mockOnSelect).toHaveBeenCalledWith('Process Files');

    await user.click(screen.getByText('Export Templates'));
    expect(mockOnSelect).toHaveBeenCalledWith('Export Templates');

    await user.click(screen.getByText('Settings'));
    expect(mockOnSelect).toHaveBeenCalledWith('Settings');
  });

  it('should render navigation icons', () => {
    const { container } = render(<SidebarMenu active="Settings" onSelect={mockOnSelect} />);

    // Check that SVG icons are present (FontAwesome renders as SVG)
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBe(4); // One for each nav item
  });

  it('should have correct styling structure', () => {
    const { container } = render(<SidebarMenu active="Settings" onSelect={mockOnSelect} />);

    const aside = container.querySelector('aside');
    expect(aside).toBeInTheDocument();
    expect(aside?.className).toContain('w-72');
    expect(aside?.className).toContain('h-screen');
    expect(aside?.className).toContain('bg-white');
  });

  it('should render navigation as buttons', () => {
    render(<SidebarMenu active="Settings" onSelect={mockOnSelect} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);
  });

  it('should apply hover styles to inactive items', () => {
    render(<SidebarMenu active="Settings" onSelect={mockOnSelect} />);

    const inactiveButton = screen.getByText('Process Files').closest('button');
    expect(inactiveButton?.className).toContain('hover:bg-neutral-50');
  });
});
