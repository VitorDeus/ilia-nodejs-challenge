import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import DashboardPage from "@/pages/DashboardPage";

const mockGet = vi.fn();
vi.mock("@/lib/axios", () => ({
  walletApi: { get: (...args: unknown[]) => mockGet(...args) },
  usersApi: { post: vi.fn() },
}));

vi.mock("@/lib/auth", () => ({
  getToken: () => "fake-token",
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

function renderDashboard() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders balance and transactions", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === "/balance") {
        return Promise.resolve({
          data: { userId: "u1", balance: 3500, currency: "USD" },
        });
      }
      if (url === "/transactions") {
        return Promise.resolve({
          data: {
            data: [
              {
                id: "t1",
                userId: "u1",
                type: "credit",
                amount: 5000,
                currency: "USD",
                description: null,
                createdAt: "2026-01-01T00:00:00Z",
              },
              {
                id: "t2",
                userId: "u1",
                type: "debit",
                amount: 1500,
                currency: "USD",
                description: null,
                createdAt: "2026-01-02T00:00:00Z",
              },
            ],
            total: 2,
            limit: 20,
            offset: 0,
          },
        });
      }
      return Promise.reject(new Error("unknown"));
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId("balance-value")).toHaveTextContent("3,500.00");
    });

    await waitFor(() => {
      expect(screen.getByTestId("transaction-list")).toBeInTheDocument();
      expect(screen.getByText("+5,000.00")).toBeInTheDocument();
      expect(screen.getByText("-1,500.00")).toBeInTheDocument();
    });
  });

  it("shows empty state for no transactions", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === "/balance") {
        return Promise.resolve({
          data: { userId: "u1", balance: 0, currency: "USD" },
        });
      }
      if (url === "/transactions") {
        return Promise.resolve({ data: { data: [], total: 0, limit: 20, offset: 0 } });
      }
      return Promise.reject(new Error("unknown"));
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId("empty-transactions")).toBeInTheDocument();
    });
  });
});
