"use client"; // Enables client-side rendering for this component

import React, { useState, useEffect } from "react"; // Import React and hooks
import { Input } from "@/components/ui/input"; // Import custom Input component
import { Button } from "@/components/ui/button"; // Import custom Button component
import { CopyIcon, Loader } from "lucide-react"; // Import CopyIcon and Loader from lucide-react
import axios from "axios"; // Import axios for HTTP requests

const BITLY_API_URL = "https://api-ssl.bitly.com/v4/shorten";
const BITLY_ACCESS_TOKEN = process.env.NEXT_PUBLIC_BITLY_ACCESS_TOKEN;

export default function URLShortener() {
  const [longUrl, setLongUrl] = useState<string>(""); // State for long URL input
  const [shortUrl, setShortUrl] = useState<string>(""); // State for shortened URL
  const [customAlias, setCustomAlias] = useState<string>(""); // State for custom alias
  const [expirationDate, setExpirationDate] = useState<string>(""); // State for expiration date
  const [loading, setLoading] = useState<boolean>(false); // State for loading spinner
  const [error, setError] = useState<string>(""); // State for error messages
  const [urlHistory, setUrlHistory] = useState<{ longUrl: string; shortUrl: string }[]>([]); // State for URL history

  // Load URL history from local storage
  useEffect(() => {
    const storedUrls = JSON.parse(localStorage.getItem("urlHistory") || "[]");
    setUrlHistory(storedUrls); // Load saved URLs on initial render
  }, []);

  // Save URL to history
  const saveUrlToHistory = (newShortUrl: string) => {
    const updatedHistory = [...urlHistory, { longUrl, shortUrl: newShortUrl }];
    setUrlHistory(updatedHistory);
    localStorage.setItem("urlHistory", JSON.stringify(updatedHistory)); // Save to localStorage
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Reset error
    setShortUrl(""); // Reset shortened URL
    setLoading(true); // Show spinner while loading

    try {
      const response = await axios.post(
        BITLY_API_URL,
        {
          long_url: longUrl,
          custom_bitlink: customAlias ? { domain: "bit.ly", slug: customAlias } : undefined, // Add custom alias if provided
          expiration_date: expirationDate ? new Date(expirationDate).toISOString() : undefined, // Add expiration date if provided
        },
        {
          headers: {
            Authorization: `Bearer ${BITLY_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      const newShortUrl = response.data.link;
      setShortUrl(newShortUrl); // Set shortened URL
      saveUrlToHistory(newShortUrl); // Save to history
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to shorten the URL. Please try again."); 
      } else if (error instanceof Error) {
        setError(error.message || "Failed to shorten the URL. Please try again.");
      } else {
        setError("An unknown error occurred.");
      }
    }
    
  };

  // Function to copy the shortened URL to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    alert("Successfully copied the short URL!"); // Notify user that URL was copied
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-primary to-secondary">
      <div className="max-w-md w-full space-y-4 p-6 rounded-lg bg-background shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">URL Shortener</h1>
          <p className="text-muted-foreground">Paste your long URL and get a short, shareable link.</p>
        </div>
        {/* Form to input and submit the long URL */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <Input
              type="url"
              placeholder="Paste your long URL here"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              className="pr-16"
              required
            />
            <Button type="submit" className="absolute top-1/2 right-2 -translate-y-1/2" disabled={loading}>
              {loading ? <Loader className="animate-spin w-5 h-5" /> : "Shorten"}
            </Button>
          </div>
          {/* Input for custom alias */}
          <Input
            type="text"
            placeholder="Optional: Enter a custom alias"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
          />
          {/* Input for expiration date */}
          <Input
            type="date"
            placeholder="Set expiration date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
          {/* Display error message if any */}
          {error && <div className="text-red-500 text-center">{error}</div>}
          {/* Display the shortened URL and copy button */}
          {shortUrl && (
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <Input type="text" value={shortUrl} readOnly className="cursor-pointer" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-muted/50"
                onClick={handleCopy}
              >
                <CopyIcon className="w-5 h-5" />
                <span className="sr-only">Copy</span>
              </Button>
            </div>
          )}
        </form>
        {/* Display shortened URL history */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Shortened URLs History:</h2>
          <div className="space-y-2">
            {urlHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history yet.</p>
            ) : (
              urlHistory.map((url, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="truncate">{url.longUrl}</span>
                  <a href={url.shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    {url.shortUrl}
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
