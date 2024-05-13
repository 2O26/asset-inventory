import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useMutation, useQuery } from "@tanstack/react-query";
import { UpdateTrelloKeys, GetTrelloKeys } from '../../Services/ApiService';
import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import './TrelloSettings.css';

export default function TrelloSettings() {
  const [trelloApiKey, setTrelloApiKey] = useState('');
  const [trelloToken, setTrelloToken] = useState('');
  const [trelloBoardId, setTrelloBoardId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [checkConnectionColor, setCheckConnectionColor] = useState('var(--button-color)');
  const [checkConnectionText, setCheckConnectionText] = useState('Check Connection');
  const [successMessage, setSuccessMessage] = useState(''); // New state for success message

  const { mutate: mutateSave, isPending: isPendingMutSave, isError: isErrorMutSave, error: errorMutSave } = useMutation({
    mutationFn: () => UpdateTrelloKeys({ apiKey: trelloApiKey, token: trelloToken, boardId: trelloBoardId }),
    onSuccess: (data) => {
      if (data.success === "success") {
        console.log("Trello keys updated successfully:", data);
        setSuccessMessage('Trello settings updated successfully'); // Set success message
        // Clear the success message after a few seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        console.log("Could not update Trello keys. Error: ", data.success);
      }
    },
    onError: (error) => {
      console.error("Update Trello keys error: ", error);
    }
  });

  const { data: trelloKeysData, isLoading: isLoading, isError: isErrorKey, error: keyerror, refetch: refetchTrelloKeys } = useQuery({
    queryKey: ['Trello keys'],
    queryFn: GetTrelloKeys,
    enabled: true
  });

  useEffect(() => {
    if (trelloKeysData) {
      setTrelloApiKey(trelloKeysData.apiKey);
      setTrelloToken(trelloKeysData.token);
      setTrelloBoardId(trelloKeysData.boardId);
    }
  }, [trelloKeysData]);

  const handleSave = () => {
    mutateSave();
  };

  const handleCheckConnection = async () => {
    try {
      const url = `https://api.trello.com/1/boards/${trelloBoardId}`;
      const response = await axios.get(url, {
        params: {
          key: trelloApiKey,
          token: trelloToken,
        },
      });
      if (response.status === 200) {
        setConnectionStatus('connected');
        setCheckConnectionColor('green');
        setCheckConnectionText('Successful');
        setTimeout(() => {
          setCheckConnectionColor('var(--button-color)');
          setCheckConnectionText('Check Connection');
        }, 1000);
      } else {
        setConnectionStatus('failed');
        setCheckConnectionColor('red');
        setCheckConnectionText('Failed');
        setTimeout(() => {
          setCheckConnectionColor('var(--button-color)');
          setCheckConnectionText('Check Connection');
        }, 1000);
      }
    } catch (error) {
      setConnectionStatus('failed');
      setCheckConnectionColor('red');
      setCheckConnectionText('Failed');
      setTimeout(() => {
        setCheckConnectionColor('var(--button-color)');
        setCheckConnectionText('Check Connection');
      }, 1000);
    }
  };

  if (isLoading) {
    return (
      <div>
        <LoadingSpinner />
      </div>
    );
  }

  if (isErrorKey) {
    return (
      <div>
        <p>Error, {keyerror}</p>
      </div>
    );
  }

  return (
    <div className="trello-settings">
      <h3>Trello Settings</h3>
      {successMessage && <div className="success-message">{successMessage}</div>} {/* Display success message */}
      <div className="form-group">
        <label htmlFor="trelloApiKey">Trello API Key:</label>
        <input
          type="text"
          id="trelloApiKey"
          value={trelloApiKey}
          onChange={(e) => setTrelloApiKey(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="trelloToken">Trello Token:</label>
        <input
          type="text"
          id="trelloToken"
          value={trelloToken}
          onChange={(e) => setTrelloToken(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="trelloBoardId">Trello Board ID:</label>
        <input
          type="text"
          id="trelloBoardId"
          value={trelloBoardId}
          onChange={(e) => setTrelloBoardId(e.target.value)}
        />
      </div>
      <div className="button-group">
        <button className="save-btn" onClick={handleSave}>
          Save
        </button>
        {isPendingMutSave && <LoadingSpinner />}
        {isErrorMutSave && <div className='errorMessage'>{errorMutSave.message}</div>}
        <button
          className="check-btn"
          style={{ backgroundColor: checkConnectionColor }}
          onClick={handleCheckConnection}
        >
          {checkConnectionText}
        </button>
      </div>
    </div>
  );
}