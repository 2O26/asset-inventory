import './TrelloTab.css'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GetTrelloKeys } from '../Services/ApiService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';

export default function TrelloTab({ assetID }) {
  const [trelloList, setTrelloList] = useState(null);
  const [trelloCards, setTrelloCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardDescription, setCardDescription] = useState('');
  const [activeCardId, setActiveCardId] = useState(null);
  const [editingCardName, setEditingCardName] = useState(null);
  const [currentCardName, setCurrentCardName] = useState('');
  const [trelloKeys, setTrelloKeys] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const keys = await GetTrelloKeys();
        setTrelloKeys(keys);
        const list = await fetchTrelloListByName(assetID, keys);
        if (list) {
          setTrelloList(list);
          const cards = await fetchTrelloCards(list.id, keys);
          setTrelloCards(cards);
        } else {
          setTrelloList(null);
          setTrelloCards([]);
        }
      } catch (error) {
        console.error('Error fetching data from Trello:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [assetID]);

  useEffect(() => {
    async function checkConnection() {
      try {
        const url = `https://api.trello.com/1/boards/${trelloKeys?.boardId}`;
        const response = await axios.get(url, {
          params: {
            key: trelloKeys?.apiKey,
            token: trelloKeys?.token,
          },
        });
        if (response.status === 200) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('failed');
        }
      } catch (error) {
        setConnectionStatus('failed');
      }
    }

    if (trelloKeys?.boardId && trelloKeys?.apiKey && trelloKeys?.token) {
      checkConnection();
    }
  }, [trelloKeys]);

  async function fetchTrelloListByName(listName, keys) {
    try {
      const url = `https://api.trello.com/1/boards/${keys.boardId}/lists`;
      const response = await axios.get(url, {
        params: {
          key: keys.apiKey,
          token: keys.token
        },
      });
      return response.data.find(list => list.name === listName) || null;
    } catch (error) {
      console.error(`Error fetching Trello list: ${error}`);
      throw error;
    }
  }

  async function fetchTrelloCards(listId, keys) {
    try {
      const url = `https://api.trello.com/1/lists/${listId}/cards`;
      const response = await axios.get(url, {
        params: {
          key: keys.apiKey,
          token: keys.token,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching Trello cards: ${error}`);
      throw error;
    }
  }

  const handleAddCardToList = async (listId) => {
    const url = `https://api.trello.com/1/cards`;
    try {
      const response = await axios.post(url, null, {
        params: {
          name: 'New Card',
          desc: '',
          idList: listId,
          key: trelloKeys.apiKey,
          token: trelloKeys.token,
        },
      });
      if (response.data && response.data.id) {
        setCardDescription('');
        const updatedCards = await fetchTrelloCards(listId, trelloKeys);
        setTrelloCards(updatedCards);
      }
    } catch (error) {
      console.error('Error creating a card:', error);
    }
  };

  const handleCardDescriptionChange = (e) => {
    setCardDescription(e.target.value);
  };

  const handleCardClick = (cardId) => {
    setActiveCardId(cardId);
    const card = trelloCards.find((card) => card.id === cardId);
    setCardDescription(card ? card.desc : '');
  };

  const handleCreateList = async () => {
    if (!isLoading && trelloKeys) {
      setIsLoading(true);
      try {
        const existingList = await fetchTrelloListByName(assetID, trelloKeys);
        if (!existingList) {
          const url = `https://api.trello.com/1/boards/${trelloKeys.boardId}/lists`;
          const response = await axios.post(url, null, {
            params: {
              name: assetID,
              key: trelloKeys.apiKey,
              token: trelloKeys.token,
            },
          });
          if (response.data && response.data.id) {
            setTrelloList(response.data);
            setTrelloCards([]);
          }
        } else {
          setTrelloList(existingList);
        }
      } catch (error) {
        console.error(`Error in handleCreateList: ${error}`);
      }
      setIsLoading(false);
    }
  };

  const handleSaveCardDescription = async (cardId) => {
    const cardToUpdate = trelloCards.find(card => card.id === cardId);
    if (cardToUpdate) {
      const url = `https://api.trello.com/1/cards/${cardId}`;
      try {
        await axios.put(url, null, {
          params: {
            key: trelloKeys.apiKey,
            token: trelloKeys.token,
            desc: cardDescription,
          },
        });
        setTrelloCards(trelloCards.map(card => card.id === cardId ? { ...card, desc: cardDescription } : card));
        setActiveCardId(null);
      } catch (error) {
        console.error('Error saving card description:', error);
      }
    }
  };

  const handleEditCardName = (card) => {
    setEditingCardName(card.id);
    setCurrentCardName(card.name);
  };

  const handleCardNameChange = (e) => {
    setCurrentCardName(e.target.value);
  };

  const handleSaveCardName = async (cardId) => {
    const url = `https://api.trello.com/1/cards/${cardId}`;
    try {
      await axios.put(url, null, {
        params: {
          key: trelloKeys.apiKey,
          token: trelloKeys.token,
          name: currentCardName,
        },
      });
      setTrelloCards(trelloCards.map(card => card.id === cardId ? { ...card, name: currentCardName } : card));
      setEditingCardName(null);
    } catch (error) {
      console.error('Error updating card name:', error);
    }
  };

  const handleRemoveCard = async (cardId) => {
    const url = `https://api.trello.com/1/cards/${cardId}`;
    await axios.delete(url, {
      params: {
        key: trelloKeys.apiKey,
        token: trelloKeys.token,
      },
    });
    const updatedCards = trelloCards.filter(card => card.id !== cardId);
    setTrelloCards(updatedCards);
  };

  const handleRemoveList = async () => {
    if (window.confirm("Are you sure you want to delete this list? This action cannot be undone.")) {
      const url = `https://api.trello.com/1/lists/${trelloList.id}/closed`;
      await axios.put(url, null, {
        params: {
          value: true,
          key: trelloKeys.apiKey,
          token: trelloKeys.token,
        },
      });
      setTrelloList(null);
      setTrelloCards([]);
    }
  };

  const renderCardEditElements = (card) => {
    return (
      <div className="trello-card-item">
        <div
          className={`card-name ${editingCardName === card.id ? 'editing' : ''}`}
          onClick={() => editingCardName !== card.id && handleEditCardName(card)}
        >
          {editingCardName === card.id ?
            (
              <input
                type="text"
                value={currentCardName}
                onChange={handleCardNameChange}
                onBlur={() => handleSaveCardName(card.id)}
                onKeyPress={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSaveCardName(card.id);
                  }
                }}
                autoFocus
              />
            ) : (
              card.name || 'New Card (click to rename)'
            )}
        </div>
        <div
          className={`card-description ${activeCardId === card.id ? 'active' : ''}`}
          onClick={() => setActiveCardId(card.id)}
        >
          {activeCardId === card.id ? (
            <textarea
              value={cardDescription}
              onChange={handleCardDescriptionChange}
              onBlur={() => {
                handleSaveCardDescription(card.id);
                setActiveCardId(null);
              }}
            />
          ) : (
            card.desc || 'Click here to add a description...'
          )}
        </div>
        <button className="remove-card-button" onClick={() => handleRemoveCard(card.id)} title="Remove Card"></button>
      </div>
    );
  };

  const renderTrelloContent = () => {
    if (!trelloKeys || !trelloKeys.boardId || !trelloKeys.apiKey || !trelloKeys.token) {
      return (
        <div className="trello-create-list-button">
          Trello settings not configured. Please set the Trello board ID, API key, and token in the Settings page.
        </div>
      );
    }

    if (connectionStatus === 'failed') {
      return (
        <div className="trello-create-list-button">
          Trello settings are incorrect. Please check the Trello board ID, API key, and token in the Settings page.
        </div>
      );
    }

    if (!trelloList) {
      return (
        <div className="trello-create-list-button" onClick={handleCreateList}>
          Create Trello List for Asset ID: {assetID}
        </div>
      );
    }

    return (
      <>
        <div className="trello-list-header">
          <h3>Asset ID: {assetID}</h3>
          <div className="header-buttons">
            <button className="add-card-button" onClick={() => handleAddCardToList(trelloList.id)}>
              Add Card
            </button>
            <button className="remove-list-button" onClick={handleRemoveList}>
              Remove List
            </button>
          </div>
        </div>
        <ul className="trello-card-list">
          {trelloCards.map((card) => (
            <li key={card.id} className="trello-card-item">
              {renderCardEditElements(card)}
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="asset-info-container">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        renderTrelloContent()
      )}
    </div>
  );
}