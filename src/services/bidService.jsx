import axios from '@/api/axios';

class BidService {
    constructor() {
        this.baseURL = '/bids';
    }

    async createBid(bidCreateRequest) {
        try {
            if (!bidCreateRequest.farmerNic) {
                throw new Error('Farmer NIC is required');
            }
    
            const harvestDate = new Date(bidCreateRequest.harvestDate);
            harvestDate.setHours(12, 0, 0, 0);
    
            const response = await axios.post(this.baseURL, {
                ...bidCreateRequest,
                harvestDate: harvestDate.toISOString(),
                status: 'ACTIVE'
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getAllBids({ signal, ...filters } = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filters.status && filters.status !== 'all') {
                params.append('status', filters.status);
            }
            if (filters.dateRange) {
                const days = parseInt(filters.dateRange);
                const fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - days);
                params.append('fromDate', fromDate.toISOString());
            }
            if (filters.searchTerm) {
                params.append('searchTerm', filters.searchTerm);
            }

            const response = await axios.get(`${this.baseURL}/admin/all`, {
                params,
                signal
            });

            return response.data.map(bid => ({
                ...bid,
                bidOffers: bid.bidOffers || [],
                buyerNic: bid.winningBuyerNic || 
                         (bid.bidOffers && bid.bidOffers.length > 0 
                            ? bid.bidOffers.map(offer => offer.buyerNic).join(", ") 
                            : '-'),
                winningBidPrice: bid.winningBidAmount || null,
                createdAt: bid.postedDate ? new Date(bid.postedDate).toLocaleDateString() : 'Invalid Date'
            }));
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getFilteredBids(filters = {}) {
        try {
            const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value && value !== 'ALL' && value !== '') {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await axios.get(`${this.baseURL}/active`, { 
                params: cleanFilters 
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getFarmerBids(farmerNic) {
        try {
            if (!farmerNic) {
                throw new Error('Farmer NIC is required');
            }

            const response = await axios.get(`${this.baseURL}/farmer/${farmerNic}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getBuyerWinningBids(buyerNic) {
        try {
            if (!buyerNic) {
                throw new Error('Buyer NIC is required');
            }

            const response = await axios.get(`${this.baseURL}/buyer/${buyerNic}/winning`);
            return response.data;
        } catch (error) {
            console.error('Error in getBuyerWinningBids:', error);
            throw this.handleError(error);
        }
    }

    async getBidDetails(bidId) {
        try {
            if (!bidId) {
                throw new Error('Bid ID is required');
            }

            const response = await axios.get(`${this.baseURL}/${bidId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async placeBid(bidOfferRequest) {
        try {
            if (!bidOfferRequest.bidId || !bidOfferRequest.buyerNic || !bidOfferRequest.bidAmount) {
                throw new Error('Bid ID, Buyer NIC, and bid amount are required');
            }

            const response = await axios.post(`${this.baseURL}/offer`, bidOfferRequest);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async acceptBidOffer(bidId, buyerNic) {
        try {
            if (!bidId || !buyerNic) {
                throw new Error('Bid ID and Buyer NIC are required');
            }

            const response = await axios.post(`${this.baseURL}/${bidId}/accept-offer`, null, {
                params: { buyerNic }
            });
            return response.data;
        } catch (error) {
            if (error.response?.status === 500) {
                throw new Error('Server error while processing the offer. Please try again.');
            }
            throw this.handleError(error);
        }
    }

    async cancelBid(bidId) {
        try {
            if (!bidId) {
                throw new Error('Bid ID is required');
            }

            const response = await axios.post(`${this.baseURL}/${bidId}/cancel`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateBidStatus(bidId, status) {
        try {
            if (!bidId || !status) {
                throw new Error('Bid ID and status are required');
            }

            const response = await axios.put(`${this.baseURL}/admin/${bidId}/status`, null, {
                params: { status }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async forceCompleteBid(bidId, buyerNic, amount) {
        try {
            if (!bidId || !buyerNic || !amount) {
                throw new Error('Bid ID, Buyer NIC, and amount are required');
            }

            const response = await axios.put(`${this.baseURL}/admin/${bidId}/force-complete`, null, {
                params: { buyerNic, amount }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getBidStatistics() {
        try {
            const response = await axios.get(`${this.baseURL}/admin/statistics`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    handleError(error) {
        console.error('API Error:', error.response || error);

        if (error.response?.data?.message) {
            return new Error(error.response.data.message);
        }

        if (error.code === 'ERR_NETWORK') {
            return new Error('Cannot connect to server. Please check your connection.');
        }

        if (error.code === 'ECONNABORTED') {
            return new Error('Request timeout - please try again.');
        }

        if (error.response?.status === 400) {
            return new Error('Invalid request. Please check your input.');
        }

        if (error.response?.status === 401) {
            return new Error('Please log in to continue.');
        }

        if (error.response?.status === 403) {
            return new Error('You do not have permission to perform this action.');
        }

        if (error.response?.status === 404) {
            return new Error('The requested resource was not found.');
        }

        if (error.response?.status === 409) {
            return new Error('This operation conflicts with an existing resource.');
        }

        if (error.response?.status >= 500) {
            return new Error('Server error. Please try again later.');
        }

        return new Error(error.message || 'An unexpected error occurred.');
    }

    formatBidData(bid) {
        return {
            ...bid,
            formattedDate: bid.createdAt ? new Date(bid.createdAt).toLocaleDateString() : '',
            formattedPrice: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'LKR',
                minimumFractionDigits: 2
            }).format(bid.minimumPrice)
        };
    }
}

export const bidService = new BidService();