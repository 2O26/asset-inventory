import React, { useState } from 'react';
import Modal from 'react-modal';
import './RemoveAsset.css';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { useQueryClient } from '@tanstack/react-query';
import { UpdateAsset } from '../Services/ApiService';

export default function RemoveAsset({ checkedItems, onAssetRemoved }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const assetData = {
            removeAsset: Object.keys(checkedItems).filter(key => checkedItems[key])
        };

        try {
            await UpdateAsset(assetData);
            queryClient.invalidateQueries(['getState']);
            setOpen(false);
            onAssetRemoved();
        } catch (error) {
            setIsError(true);
            console.error('Error removing asset:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = () => {
        if (Object.values(checkedItems).some(val => val)) {
            setOpen(true);
        } else {
            setIsError(true);
        }
    };

    const handleCloseModal = () => {
        setOpen(false);
        setIsError(false);
    };

    return (
        <div>
            <button onClick={handleOpenModal} className="standard-button">Remove Asset</button>
            <Modal
                isOpen={open}
                ariaHideApp={false}
                contentLabel="Remove Asset"
                overlayClassName="reactModalOverlay"
                className="reactModalContent"
                shouldReturnFocusAfterClose={false}
            >
                <div>
                    <form onSubmit={handleSubmit} className='asset-form'>
                        <h2>Remove Asset</h2>
                        {/* Display a list of IDs to be removed for user confirmation */}
                        <div className='asset-id-list'>
                            {Object.keys(checkedItems).filter(key => checkedItems[key]).map(key => (
                                <p key={key} className='asset-id-item'>{key}</p>
                            ))}
                        </div>
                        {isLoading && <LoadingSpinner />}
                        {isError && <p className="errorMessage">Please select at least one asset to remove.</p>}
                        <div className="AuthBtnContainer">
                            <button
                                className="standard-button"
                                disabled={isLoading || !Object.values(checkedItems).some(val => val)}
                                type="submit"
                            >
                                Remove
                            </button>
                            <button
                                className="standard-button"
                                disabled={isLoading}
                                onClick={handleCloseModal}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}