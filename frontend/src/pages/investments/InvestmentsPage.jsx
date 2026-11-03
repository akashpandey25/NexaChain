import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { AppButton } from '../../components/common/AppButton';
import { FormField } from '../../components/common/FormField';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../../components/feedback/ErrorMessage';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  useGetInvestmentsQuery,
  useCreateInvestmentMutation
} from '../../features/investments/investmentApi';
import { PiggyBank, Plus, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

const formatPaise = (paise = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(paise / 100);
};

export const InvestmentsPage = () => {
  const { data, isLoading, error, refetch } = useGetInvestmentsQuery();
  const [createInvestment, { isLoading: isCreating, error: createError }] = useCreateInvestmentMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amountRupees: '1000',
    planName: 'GROWTH'
  });
  const [validationError, setValidationError] = useState('');

  const investments = data?.data?.investments || (Array.isArray(data?.data) ? data.data : []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setValidationError('');

    const rupees = parseFloat(formData.amountRupees);
    if (isNaN(rupees) || rupees <= 0) {
      setValidationError('Please enter a valid investment amount in Rupees.');
      return;
    }

    const principalAmountPaise = Math.round(rupees * 100);

    try {
      await createInvestment({
        principalAmountPaise,
        planName: formData.planName.trim().toUpperCase()
      }).unwrap();
      setIsModalOpen(false);
      setFormData({ amountRupees: '1000', planName: 'GROWTH' });
    } catch (err) {
      // Handled by createError
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investments"
        subtitle="Manage your capital packages and track active daily ROI contracts"
        action={
          <AppButton
            variant="primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Investment
          </AppButton>
        }
      />

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Create Investment Package</h3>
            <p className="text-xs text-slate-400 mb-4">
              Allocate capital to start earning daily ROI yields.
            </p>

            <ErrorMessage
              title="Investment Creation Failed"
              message={createError?.message || validationError}
              errors={createError?.errors}
            />

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <FormField
                id="planName"
                label="Investment Plan"
                required
              >
                <select
                  id="planName"
                  value={formData.planName}
                  onChange={(e) => setFormData((p) => ({ ...p, planName: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="STARTER">Starter Plan (Daily 1%)</option>
                  <option value="GROWTH">Growth Plan (Daily 1.5%)</option>
                  <option value="PREMIUM">Premium Plan (Daily 2%)</option>
                </select>
              </FormField>

              <FormField
                id="amountRupees"
                label="Investment Amount (₹)"
                required
                hint="Minimum ₹100. Entered in INR (stored securely as integer paise)."
              >
                <input
                  id="amountRupees"
                  type="number"
                  min="100"
                  step="100"
                  value={formData.amountRupees}
                  onChange={(e) => setFormData((p) => ({ ...p, amountRupees: e.target.value }))}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-2">
                <AppButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="submit"
                  variant="primary"
                  isLoading={isCreating}
                >
                  Confirm Investment
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading your investments..." />
        </div>
      ) : error ? (
        <ErrorMessage
          title="Could not load investments"
          message={error.message}
          onRetry={refetch}
        />
      ) : investments.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No Investments Yet"
          description="You haven't created any investment packages yet. Start your portfolio today to begin earning automated daily returns."
          actionText="Create First Investment"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {investments.map((inv) => {
            const isActive = inv.status === 'ACTIVE';
            return (
              <div
                key={inv._id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                      {inv.planName || 'STANDARD'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {inv.status}
                    </span>
                  </div>

                  <div className="text-xl font-bold text-white mb-1">
                    {formatPaise(inv.principalAmountPaise)}
                  </div>
                  <div className="text-xs text-slate-400">
                    Total ROI Earned: <span className="text-emerald-400 font-semibold">{formatPaise(inv.totalRoiEarnedPaise || 0)}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Created {new Date(inv.createdAt).toLocaleDateString()}</span>
                  <Link
                    to={`/investments/${inv._id}`}
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    View Details
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

