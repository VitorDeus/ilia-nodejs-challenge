import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import LoginPage from "@/pages/LoginPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockPost = vi.fn();
vi.mock("@/lib/axios", () => ({
  usersApi: { post: (...args: unknown[]) => mockPost(...args) },
  walletApi: { get: vi.fn() },
}));

function renderLogin() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation errors for empty fields", async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /auth\.signIn/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/invalid|at least/i).length).toBeGreaterThan(0);
    });
  });

  it("calls login endpoint and navigates on success", async () => {
    mockPost.mockResolvedValueOnce({ data: { token: "fake-jwt" } });
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/auth\.email/i), "alice@test.com");
    await user.type(screen.getByLabelText(/auth\.password/i), "Str0ng!Pass");
    await user.click(screen.getByRole("button", { name: /auth\.signIn/i }));
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/auth/login", {
        email: "alice@test.com",
        password: "Str0ng!Pass",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/app", { replace: true });
    });
  });

  it("shows error when login fails", async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { error: "Invalid credentials" } },
    });
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/auth\.email/i), "bad@test.com");
    await user.type(screen.getByLabelText(/auth\.password/i), "WrongPass1");
    await user.click(screen.getByRole("button", { name: /auth\.signIn/i }));
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });
});
