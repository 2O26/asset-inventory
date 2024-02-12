// Profile.jsx
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AssetHandlerStatus } from '../Services/ApiService';

export default function Profile() {

    //Visa skillnad mellan useState och enabled: false vs enabled: true
    const [word, setWord] = useState("untouched");
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['assetHandlerStatus'],
        queryFn: AssetHandlerStatus,
        enabled: false
    });


    return (
        <div style={{ color: "#fff" }}>
            <h3 style={{ color: "var(--text-color)", marginTop: "4rem" }}>Profile</h3>
            <button onClick={() => { refetch(); setWord("touched") }}>Check AssetHandler Status</button>
            {!data ? <p style={{ marginTop: "10px" }}>no data, press the button to fetch</p> : <p style={{ marginTop: "10px" }}> Status: {data.message} </p>}
            {data && <p> Time: {data.time} </p>}
            {isLoading ? <p style={{ marginTop: "10px" }}>loading...</p> : null}
            {isError ? <p style={{ marginTop: "10px" }}>Error: {error.message}</p> : null}
            <p>Word: {word}</p>
        </div>
    );
}
