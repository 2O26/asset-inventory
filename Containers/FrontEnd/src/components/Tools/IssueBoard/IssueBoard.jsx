import React, { useEffect, useState } from 'react';
import { FaTrello } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { GetTrelloKeys } from '../../Services/ApiService';

const IssueBoard = () => {
  const [boardId, setBoardId] = useState('');

  const { data: trelloKeysData, isLoading, isError, error } = useQuery({
    queryKey: ['Trello keys'],
    queryFn: GetTrelloKeys,
    enabled: true,
  });

  useEffect(() => {
    if (trelloKeysData) {
      setBoardId(trelloKeysData.boardId);
    }
  }, [trelloKeysData]);

  const handleOpenTrelloBoard = () => {
    const trelloBoardUrl = `https://trello.com/b/${boardId}`;
    window.open(trelloBoardUrl, '_blank');
  };

  return (
    <button className='button-tool' onClick={handleOpenTrelloBoard}>
      <FaTrello size={60} />
      <div>Issue Board</div>
    </button>
  );
};

export default IssueBoard;