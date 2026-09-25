import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, wishlistApi } from '../services/api';
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
  wishlist: ['wishlist'] as const,
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
  });

  const summaryQuery = useQuery({
    queryKey: QUERY_KEYS.dashboardSummary,
    queryFn: () => api.getDashboardSummary(),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
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

  const wishlistQuery = useQuery({
    queryKey: QUERY_KEYS.wishlist,
    queryFn: () => wishlistApi.getWishlists(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
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
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.categories });

      // 2. Snapshot previous state for rollback
      const prevTransactions = queryClient.getQueryData<Transaction[]>(QUERY_KEYS.transactions) || [];
      const prevSummary = queryClient.getQueryData<DashboardSummary | null>(QUERY_KEYS.dashboardSummary);
      const prevCategories = queryClient.getQueryData<ActiveCategory[]>(QUERY_KEYS.categories) || [];

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

      // 5. Instantly update active category spent amount if envelope assigned
      if (newTxnVars.txnType === 'debit' && newTxnVars.envelopeId) {
        queryClient.setQueryData<ActiveCategory[]>(QUERY_KEYS.categories, (old = []) =>
          old.map((cat) =>
            cat.envelope_id === newTxnVars.envelopeId
              ? { ...cat, spent_amount_e5: (cat.spent_amount_e5 || 0) + roundedAmt }
              : cat
          )
        );
      }

      // 6. Instantly update dashboard summary & account balance numbers
      if (prevSummary) {
        queryClient.setQueryData<DashboardSummary>(QUERY_KEYS.dashboardSummary, (old) => {
          if (!old) return old!;
          const isCard = newTxnVars.paymentMethod === 'bank_card';
          const baseIncome = old.base_income_e5 ?? old.total_income_e5;

          if (newTxnVars.txnType === 'debit') {
            const newTotalExpense = old.total_expense_e5 + roundedAmt;
            const bufferedTotal = old.buffered_income_e5 ?? 0;

            let newBufferedUsed = 0;
            let newTotalRemaining = 0;

            if (newTotalExpense <= baseIncome) {
              newTotalRemaining = baseIncome - newTotalExpense;
              newBufferedUsed = 0;
            } else {
              const deficit = newTotalExpense - baseIncome;
              if (deficit <= bufferedTotal) {
                newBufferedUsed = deficit;
                newTotalRemaining = 0;
              } else {
                newBufferedUsed = bufferedTotal;
                newTotalRemaining = -(deficit - bufferedTotal);
              }
            }

            const newBufferedRemaining = bufferedTotal - newBufferedUsed;
            const newEffectiveIncome = baseIncome + newBufferedUsed;

            return {
              ...old,
              total_income_e5: newEffectiveIncome,
              base_income_e5: baseIncome,
              buffered_income_e5: bufferedTotal,
              buffered_used_e5: newBufferedUsed,
              buffered_remaining_e5: newBufferedRemaining,
              total_expense_e5: newTotalExpense,
              total_remaining_e5: newTotalRemaining,
              card_spent_e5: isCard ? old.card_spent_e5 + roundedAmt : old.card_spent_e5,
              bank_spent_e5: !isCard ? old.bank_spent_e5 + roundedAmt : old.bank_spent_e5,
            };
          } else if (newTxnVars.txnType === 'credit') {
            const newBufferedIncome = (old.buffered_income_e5 ?? 0) + roundedAmt;
            const totalExpense = old.total_expense_e5;

            let newBufferedUsed = 0;
            let newTotalRemaining = 0;

            if (totalExpense <= baseIncome) {
              newTotalRemaining = baseIncome - totalExpense;
              newBufferedUsed = 0;
            } else {
              const deficit = totalExpense - baseIncome;
              if (deficit <= newBufferedIncome) {
                newBufferedUsed = deficit;
                newTotalRemaining = 0;
              } else {
                newBufferedUsed = newBufferedIncome;
                newTotalRemaining = -(deficit - newBufferedIncome);
              }
            }

            const newBufferedRemaining = newBufferedIncome - newBufferedUsed;
            const newEffectiveIncome = baseIncome + newBufferedUsed;

            return {
              ...old,
              total_income_e5: newEffectiveIncome,
              base_income_e5: baseIncome,
              buffered_income_e5: newBufferedIncome,
              buffered_used_e5: newBufferedUsed,
              buffered_remaining_e5: newBufferedRemaining,
              total_remaining_e5: newTotalRemaining,
            };
          }
          return old;
        });
      }

      return { prevTransactions, prevSummary, prevCategories, optimisticId };
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous snapshots if backend rejected
      if (context?.prevTransactions) {
        queryClient.setQueryData(QUERY_KEYS.transactions, context.prevTransactions);
      }
      if (context?.prevSummary) {
        queryClient.setQueryData(QUERY_KEYS.dashboardSummary, context.prevSummary);
      }
      if (context?.prevCategories) {
        queryClient.setQueryData(QUERY_KEYS.categories, context.prevCategories);
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
    wishlist: wishlistQuery.data || null,
    isLoadingWishlist: wishlistQuery.isLoading,
    refetchAll: async () => {
      await Promise.allSettled([
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.user, exact: true }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.transactions, exact: true }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.dashboardSummary, exact: true }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.categories, exact: true }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.envelopes, exact: true }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.envelopeGroups, exact: true }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.wishlist, exact: true }),
      ]);
    },
    createTxnMutation,
  };
}
