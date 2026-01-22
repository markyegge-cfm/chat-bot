class Header {
  static render() {
    return `
      <header class="h-[64px] bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
        <!-- Mobile Menu Toggle (hidden on desktop) -->
        <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Toggle menu">
          ☰
        </button>

        <!-- Left: System Status -->
        <div class="flex items-center gap-2.5 text-[13px] font-medium text-gray-600">
          <span class="w-2 h-2 rounded-full bg-[#27ae60] shadow-[0_0_0_3px_rgba(39,174,96,0.15)]"></span>
          System Ok
        </div>

        <!-- Right: User Profile -->
        <div class="flex items-center gap-3 px-4 py-2 bg-[#F5F5F5] rounded-full">
          <div class="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[11px] font-bold text-gray-700 tracking-wider">AT</div>
          <span class="text-[13px] font-semibold text-gray-800">Admin</span>
        </div>
      </header>
    `;
  }
}
