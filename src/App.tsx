import { useState, useEffect } from 'react';
import './App.css';

interface Symbol {
    symbol: string;
    status: string;
    baseAsset: string;
    quoteAsset: string;
}

interface Price {
    symbol: string;
    price: string;
}

interface DetailedInfo {
    symbol: string;
    volume: string;
    bidPrice: string;
    askPrice: string;
    highPrice: string;
    lowPrice: string;
}

const BinanceViewer = () => {
    const [symbols, setSymbols] = useState<Symbol[]>([]);
    const [filteredSymbols, setFilteredSymbols] = useState<Symbol[]>([]);
    const [quoteAssets, setQuoteAssets] = useState<string[]>([]);
    const [statuses, setStatuses] = useState<string[]>([]);
    const [selectedQuoteAssets, setSelectedQuoteAssets] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [favoritePairs, setFavoritePairs] = useState<string[]>([]);
    const [pairPrices, setPairPrices] = useState<Price[]>([]);
    const [detailedInfo, setDetailedInfo] = useState<{ [key: string]: DetailedInfo }>({});
    const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
    const [detailPanelOpen, setDetailPanelOpen] = useState<boolean>(false);

    const [startX, setStartX] = useState<number>(0);
    const [startY, setStartY] = useState<number>(0);
    const [isSwiping, setIsSwiping] = useState<boolean>(false);

    useEffect(() => {
        fetch('https://api.binance.com/api/v3/exchangeInfo')
            .then((response) => response.json())
            .then((data) => {
                const uniqueQuoteAssets = Array.from(new Set(data.symbols.map((symbol: Symbol) => symbol.quoteAsset)));
                const uniqueStatuses = Array.from(new Set(data.symbols.map((symbol: Symbol) => symbol.status)));
                setQuoteAssets(uniqueQuoteAssets);
                setStatuses(uniqueStatuses);
                setSymbols(data.symbols);
                setFilteredSymbols(data.symbols);
            });
    }, []);

    const handleFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.target.value.toLowerCase();
        const filtered = symbols.filter(symbol => symbol.symbol.toLowerCase().includes(input));
        setFilteredSymbols(filtered);
    };

    const handleQuoteAssetFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.value;
        if (selectedQuoteAssets.includes(selected)) {
            setSelectedQuoteAssets(selectedQuoteAssets.filter(asset => asset !== selected));
        } else {
            setSelectedQuoteAssets([...selectedQuoteAssets, selected]);
        }
    };

    const handleStatusFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.value;
        if (selectedStatuses.includes(selected)) {
            setSelectedStatuses(selectedStatuses.filter(status => status !== selected));
        } else {
            setSelectedStatuses([...selectedStatuses, selected]);
        }
    };

    const filteredByQuoteAndStatus = filteredSymbols.filter(symbol =>
        (selectedQuoteAssets.length === 0 || selectedQuoteAssets.includes(symbol.quoteAsset)) &&
        (selectedStatuses.length === 0 || selectedStatuses.includes(symbol.status))
    );

    const addFavoritePair = (symbol: string) => {
        if (!favoritePairs.includes(symbol)) {
            setFavoritePairs([...favoritePairs, symbol]);
        }
    };

    const removeFavoritePair = (symbol: string) => {
        setFavoritePairs(favoritePairs.filter(pair => pair !== symbol));
        setShowDetails(prev => ({ ...prev, [symbol]: false }));
    };

    const handleSwipeStart = (e: React.TouchEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>) => {
        if (e.type === "touchstart") {
            setStartX((e as React.TouchEvent).touches[0].clientX);
            setStartY((e as React.TouchEvent).touches[0].clientY);
        } else {
            setStartX((e as React.MouseEvent).clientX);
            setStartY((e as React.MouseEvent).clientY);
        }
        setIsSwiping(true);
    };

    const handleSwipeEnd = (e: React.TouchEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>, symbol: string) => {
        let endX: number;
        let endY: number;
        if (e.type === "touchend") {
            endX = (e as React.TouchEvent).changedTouches[0].clientX;
            endY = (e as React.TouchEvent).changedTouches[0].clientY;
        } else {
            endX = (e as React.MouseEvent).clientX;
            endY = (e as React.MouseEvent).clientY;
        }

        const swipeDistanceX = endX - startX;
        const swipeDistanceY = endY - startY;

        if (isSwiping && Math.abs(swipeDistanceX) > 50 && Math.abs(swipeDistanceY) < 50) {
            toggleDetails(symbol);
        }

        setIsSwiping(false);
    };

    const toggleDetails = (symbol: string) => {
        if (!showDetails[symbol]) {
            fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
                .then((response) => response.json())
                .then((data) => {
                    setDetailedInfo({
                        [symbol]: {
                            symbol: symbol,
                            volume: data.volume,
                            bidPrice: data.bidPrice,
                            askPrice: data.askPrice,
                            highPrice: data.highPrice,
                            lowPrice: data.lowPrice
                        }
                    });

                    setShowDetails({ [symbol]: true });
                    setDetailPanelOpen(true);
                });
        } else {
            setShowDetails({});
            setDetailPanelOpen(false);
        }
    };

    useEffect(() => {
        const fetchPrices = () => {
            if (favoritePairs.length > 0) {
                fetch(`https://api.binance.com/api/v3/ticker/price?symbols=[${favoritePairs.map(pair => `"${pair}"`).join(',')}]`)
                    .then((response) => response.json())
                    .then((data) => {
                        setPairPrices(data);
                    });
            }
        };

        const interval = setInterval(fetchPrices, 1000);

        return () => clearInterval(interval);
    }, [favoritePairs]);

    return (
        <div className="container">
            <div className="left-section">
                <input type="text" placeholder="Filter pairs" onChange={handleFilter} />

                <div className="filters">
                    <h3>Filter by Quote Assets</h3>
                    <div className="quote-filters">
                        {quoteAssets.map((asset) => (
                            <label key={asset} className="small-checkbox">
                                <input type="checkbox" value={asset} onChange={handleQuoteAssetFilter} />
                                {asset}
                            </label>
                        ))}
                    </div>

                    <h3>Filter by Status</h3>
                    <div className="status-filters">
                        {statuses.map((status) => (
                            <label key={status} className="small-checkbox">
                                <input type="checkbox" value={status} onChange={handleStatusFilter} />
                                {status}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pairs-list">
                    <h2>Currency Pairs</h2>
                    <ul>
                        {filteredByQuoteAndStatus.map((symbol) => (
                            <li key={symbol.symbol}>
                                <span
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => addFavoritePair(symbol.symbol)}
                                >
                                    {symbol.symbol} (Status: {symbol.status})
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="right-section">
                <h2>Favorite Pairs</h2>
                <ul>
                    {favoritePairs.map((pair) => (
                        <li
                            key={pair}
                            style={{ cursor: 'pointer', userSelect: "none" }}
                            onTouchStart={handleSwipeStart}
                            onTouchEnd={(e) => handleSwipeEnd(e, pair)}
                            onMouseDown={handleSwipeStart}
                            onMouseUp={(e) => handleSwipeEnd(e, pair)}
                        >
                            <span>
                                {pair} - {pairPrices.find(p => p.symbol === pair)?.price || 'Loading...'}
                            </span>
                            <span
                                style={{
                                    marginLeft: '10px',
                                    cursor: 'pointer',
                                    color: 'red',
                                    fontWeight: 'bold',
                                    border: '1px solid red',
                                    padding: '2px 9px',
                                    borderRadius: '5px'
                                }}
                                onClick={() => removeFavoritePair(pair)}
                            >
                                X
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {detailPanelOpen && (
                <div className="detail-panel">
                    <h3>Details</h3>
                    {favoritePairs.map((pair) => {
                        if (showDetails[pair]) {
                            return (
                                <div key={pair}>
                                    <h4>{pair}</h4>
                                    <p>Volume: {detailedInfo[pair]?.volume || 'Loading...'}</p>
                                    <p>Bid Price: {detailedInfo[pair]?.bidPrice || 'Loading...'}</p>
                                    <p>Ask Price: {detailedInfo[pair]?.askPrice || 'Loading...'}</p>
                                    <p>High Price: {detailedInfo[pair]?.highPrice || 'Loading...'}</p>
                                    <p>Low Price: {detailedInfo[pair]?.lowPrice || 'Loading...'}</p>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
};

export default BinanceViewer;
