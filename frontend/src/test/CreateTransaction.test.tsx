import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import CreateTransactionForm from "@/components/CreateTransactionForm";

const mockPost = vi.fn();
const mockGet = vi.fn();
vi.mock("@/lib/axios", () => ({
  walletApi: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
  },
  usersApi: { post: vi.fn() },
}));

vi.mock("@/lib/auth", () => ({
  getToken: () => "fake-token",
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

function renderForm() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <MemoryRouter>
          <CreateTransactionForm />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("CreateTransactionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation error for empty amount", async () => {
    renderForm();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /transaction\.create/i }));
    await waitFor(() => {
      expect(screen.getByText(/expected number|positive|required/i)).toBeInTheDocument();
    });
  });

  it("submits a credit transaction", async () => {
    mockPost.mockResolvedValueOnce({ data: { id: "t1", type: "credit", amount: 100 } });
    renderForm();
    const user = userEvent.setup();
    await user.clear(screen.getByLabelText(/transaction\.amount/i));
    await user.type(screen.getByLabelText(/transaction\.amount/i), "100");
    await user.click(screen.getByRole("button", { name: /transaction\.create/i }));
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/transactions", {
        type: "credit",
        amount: 100,
      });
    });
  });

  it("shows error when transaction fails", async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { error: "Insufficient balance" } },
    });
    renderForm();
    const user = userEvent.setup();

    const typeSelect = screen.getByTestId("tx-type");
    await user.selectOptions(typeSelect, "debit");

    await user.clear(screen.getByLabelText(/transaction\.amount/i));
    await user.type(screen.getByLabelText(/transaction\.amount/i), "999999");
    await user.click(screen.getByRole("button", { name: /transaction\.create/i }));
    await waitFor(() => {
      expect(screen.getByText("Insufficient balance")).toBeInTheDocument();
    });
  });
});
