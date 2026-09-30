import {useEffect, useState} from "react";
import axios from "axios";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

export function useApi<T>(url: string, initialData: T): { data: T, loading: boolean, error: boolean } {
    const [data, setData] = useState<T>(initialData);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        setLoading(true);
        setError(false);

        axios.get<T>(`${API_BASE_URL}${url}`)
            .then(response => {
                setData(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(true);
                console.error(`Failed to fetch data from ${url}:`, err);
                setLoading(false);
            });

    }, [url]);

    return { data, loading, error };
}