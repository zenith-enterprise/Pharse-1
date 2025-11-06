import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, Download, Calendar } from 'lucide-react';

const TransactionsTable = ({ portfolios }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'txn_date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Flatten all transactions from all portfolios
  const allTransactions = useMemo(() => {
    const txns = [];
    portfolios.forEach(portfolio => {
      portfolio.transactions?.forEach(txn => {
        txns.push({
          ...txn,
          scheme_name: portfolio.scheme_name,
          amc_name: portfolio.amc_name,
          category: portfolio.category
        });
      });
    });
    return txns;
  }, [portfolios]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(txn =>
        txn.scheme_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.amc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.txn_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.txn_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(txn => txn.txn_type === typeFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date sorting
      if (sortConfig.key === 'txn_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle numeric sorting
      if (sortConfig.key === 'txn_amount' || sortConfig.key === 'units' || sortConfig.key === 'nav_at_txn') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [allTransactions, searchTerm, typeFilter, sortConfig]);

  // Paginate transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedTransactions.slice(startIndex, endIndex);
  }, [filteredAndSortedTransactions, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Scheme', 'AMC', 'Type', 'Amount', 'NAV', 'Units'];
    const rows = filteredAndSortedTransactions.map(txn => [
      txn.txn_id,
      formatDate(txn.txn_date),
      txn.scheme_name,
      txn.amc_name,
      txn.txn_type,
      txn.txn_amount,
      txn.nav_at_txn,
      txn.units
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getTransactionTypeStyle = (type) => {
    switch (type) {
      case 'Buy':
      case 'SIP':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Sell':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Switch':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Dividend':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <Card data-testid="transactions-table-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Transaction History
            <span className="text-sm font-normal text-slate-500" data-testid="total-transactions-count">
              ({filteredAndSortedTransactions.length} transactions)
            </span>
          </CardTitle>
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            data-testid="export-csv-button"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by scheme, AMC, type, or transaction ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              data-testid="search-transactions-input"
              className="pl-10 h-10"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-48 h-10" data-testid="filter-type-select">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Buy">Buy</SelectItem>
              <SelectItem value="Sell">Sell</SelectItem>
              <SelectItem value="SIP">SIP</SelectItem>
              <SelectItem value="Switch">Switch</SelectItem>
              <SelectItem value="Dividend">Dividend</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full" data-testid="transactions-table">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('txn_date')}
                        className="flex items-center gap-1 font-semibold text-sm text-slate-700 hover:text-slate-900"
                        data-testid="sort-date"
                      >
                        Date
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('txn_id')}
                        className="flex items-center gap-1 font-semibold text-sm text-slate-700 hover:text-slate-900"
                        data-testid="sort-txn-id"
                      >
                        Transaction ID
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-sm text-slate-700">Scheme</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm text-slate-700">AMC</th>
                    <th className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleSort('txn_type')}
                        className="flex items-center gap-1 font-semibold text-sm text-slate-700 hover:text-slate-900 mx-auto"
                        data-testid="sort-type"
                      >
                        Type
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSort('txn_amount')}
                        className="flex items-center gap-1 font-semibold text-sm text-slate-700 hover:text-slate-900 ml-auto"
                        data-testid="sort-amount"
                      >
                        Amount
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSort('nav_at_txn')}
                        className="flex items-center gap-1 font-semibold text-sm text-slate-700 hover:text-slate-900 ml-auto"
                        data-testid="sort-nav"
                      >
                        NAV
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSort('units')}
                        className="flex items-center gap-1 font-semibold text-sm text-slate-700 hover:text-slate-900 ml-auto"
                        data-testid="sort-units"
                      >
                        Units
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((txn, idx) => (
                    <tr
                      key={txn.txn_id}
                      data-testid={`transaction-row-${idx}`}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {formatDate(txn.txn_date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">
                        {txn.txn_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 max-w-xs truncate">
                        {txn.scheme_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {txn.amc_name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                          getTransactionTypeStyle(txn.txn_type)
                        }`}>
                          {txn.txn_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                        {formatCurrency(txn.txn_amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-700">
                        ₹{txn.nav_at_txn?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-700">
                        {txn.units?.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length} transactions
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    data-testid="prev-page-button"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = idx + 1;
                      } else if (currentPage <= 3) {
                        pageNum = idx + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + idx;
                      } else {
                        pageNum = currentPage - 2 + idx;
                      }

                      return (
                        <Button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="w-10"
                          data-testid={`page-${pageNum}-button`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    data-testid="next-page-button"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsTable;
