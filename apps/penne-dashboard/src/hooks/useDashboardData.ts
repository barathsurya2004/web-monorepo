import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  User,
  Transaction,
  DashboardSummary,
  ActiveCategory,
  Envelope,
  EnvelopeGroup
} from '@packages/types';

export const QUERY_KEYS = {
  user: ['user'] as const,
  transactions: ['transactions'] as const,
  categories: ['categories'] as const,
  envelopeGroups: ['envelopeGroups'] as const,
  envelopes: ['envelopes'] as const,
  dashboardSummary: ['dashboardSummary'] as const,
};

export interface CreateTxnVariables {
  amountE5: number;
  txnType: string;
  paymentMethod: string;
  envelopeId?: string | null;
  createdAt?: string;
}

export function useDashboardData(isAuthenticated: boolean) {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn: () => api.getUser(),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const transactionsQuery = useQuery({
    queryKey: QUERY_KEYS.transactions,
    queryFn: async () => {
      const fresh = await api.getTransactions();
      return Array.isArray(fresh) ? fresh : [];
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // 10-second gentle background sync for new backend transactions
    refetchIntervalInBackground: false,
  });

  const summaryQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardSummary,
    queryFn: () => api.getDashboardSummary(),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  });

  const categoriesQuery = useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: async () => {
      const data = await api.getActiveCategories();
      return Array.isArray(data) ? data : [];
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const envelopesQuery = useQuery({
    queryKey: QUERY_KEYS.envelopes,
    queryFn: async () => {
      const data = await api.getEnvelopes();
      return Array.isArray(data) ? data : [];
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const groupsQuery = useQuery({
    queryKey: QUERY_KEYS.envelopeGroups,
    queryFn: async () => {
      const data = await api.getEnvelopeGroups();
      return Array.isArray(data) ? data : [];
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Optimistic Create Transaction Mutation
  const createTxnMutation = useMutation({
    mutationFn: async (variables: CreateTxnVariables) => {
      return api.createTransaction(
        variables.amountE5,
        variables.txnType,
        variables.paymentMethod,
        variables.envelopeId,
        variables.createdAt
      );
    },
    onMutate: async (newTxnVars) => {
      // 1. Cancel ongoing queries so they don't overwrite optimistic data
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.transactions });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.dashboardSummary });

      // 2. Snapshot previous state for rollback
      const prevTransactions = queryClient.getQueryData<Transaction[]>(QUERY_KEYS.transactions) || [];
      const prevSummary = queryClient.getQueryData<DashboardSummary | null>(QUERY_KEYS.dashboardSummary);

      const optimisticId = `opt-txn-${Date.now()}`;
      const nowIso = newTxnVars.createdAt || new Date().toISOString();
      const roundedAmt = Math.round(newTxnVars.amountE5);

      // 3. Optimistic transaction
      const optimisticTxn: Transaction = {
        id: optimisticId,
        user_id: api.getUserUUID() || 'current-user',
        envelope_id: newTxnVars.envelopeId || null,
        amount_e5: roundedAmt,
        txn_type: newTxnVars.txnType,
        payment_method: newTxnVars.paymentMethod,
        country_iso2: 'IN',
        created_at: nowIso,
      };

      // 4. Instantly update transactions list
      queryClient.setQueryData<Transaction[]>(QUERY_KEYS.transactions, (old = []) => [
        optimisticTxn,
        ...old,
      ]);

      // 5. Instantly update dashboard summary & account balance numbers
      if (prevSummary) {
        queryClient.setQueryData<DashboardSummary>(QUERY_KEYS.dashboardSummary, (old) => {
          if (!old) return old!;
          if (newTxnVars.txnType === 'debit') {
            const isCard = newTxnVars.paymentMethod === 'bank_card';
            return {
              ...old,
              total_expense_e5: old.total_expense_e5 + roundedAmt,
              total_remaining_e5: old.total_remaining_e5 - roundedAmt,
              card_spent_e5: isCard ? old.card_spent_e5 + roundedAmt : old.card_spent_e5,
              bank_spent_e5: !isCard ? old.bank_spent_e5 + roundedAmt : old.bank_spent_e5,
            };
          } else if (newTxnVars.txnType === 'credit') {
            return {
              ...old,
              total_income_e5: old.total_income_e5 + roundedAmt,
              total_remaining_e5: old.total_remaining_e5 + roundedAmt,
            };
          }
          return old;
        });
      }

      return { prevTransactions, prevSummary, optimisticId };
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous snapshots if backend rejected
      if (context?.prevTransactions) {
        queryClient.setQueryData(QUERY_KEYS.transactions, context.prevTransactions);
      }
      if (context?.prevSummary) {
        queryClient.setQueryData(QUERY_KEYS.dashboardSummary, context.prevSummary);
      }
    },
    onSuccess: (savedTxn, _variables, context) => {
      // Swap optimistic transaction ID with real server ID
      queryClient.setQueryData<Transaction[]>(QUERY_KEYS.transactions, (old = []) =>
        old.map((t) => (t.id === context?.optimisticId ? savedTxn : t))
      );
    },
    onSettled: () => {
      // Refetch authoritative states in background
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardSummary });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.envelopes });
    },
  });

  return {
    user: userQuery.data || null,
    transactions: transactionsQuery.data || [],
    dashboardSummary: summaryQuery.data || null,
    categories: categoriesQuery.data || [],
    envelopes: envelopesQuery.data || [],
    envelopeGroups: groupsQuery.data || [],
    isLoadingUser: userQuery.isLoading,
    isLoadingTransactions: transactionsQuery.isLoading,
    isLoadingSummary: summaryQuery.isLoading,
    isLoadingCategories: categoriesQuery.isLoading,
    isLoadingEnvelopes: envelopesQuery.isLoading,
    isLoadingGroups: groupsQuery.isLoading,
    isRefetching: transactionsQuery.isRefetching || summaryQuery.isRefetching,
    isFetching:
      userQuery.isFetching ||
      transactionsQuery.isFetching ||
      summaryQuery.isFetching ||
      categoriesQuery.isFetching ||
      envelopesQuery.isFetching ||
      groupsQuery.isFetching,
    isError: userQuery.isError || transactionsQuery.isError,
    error: userQuery.error || transactionsQuery.error,
    refetchAll: async () => {
      await Promise.allSettled([
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.user, exact: true }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.transactions, exact: true }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.dashboardSummary, exact: true }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.categories, exact: true }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.envelopes, exact: true }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.envelopeGroups, exact: true }),
      ]);
    },
    createTxnMutation,
  };
}
