import React, { useEffect, useState } from 'react'
import { AddIcon, CheckIcon, ConnectionIcon, CrossIcon, LinkAddIcon, RemoveIcon } from '../common/Icons/Icons';
import { UpdateAsset } from '../Services/ApiService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { useMutation } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { GetState } from '../Services/ApiService'
import Select from 'react-select';



export default function EditAsset({ assetData, assetID, relationData, refetch, assetIDs }) {
    const [errorMessage, setErrorMessage] = useState(null)

    // const dontDisplayList = ["Created at", "Updated at", "Hostname"];
    const dontDisplayList = ["Created at", "Updated at"];
    const [properties, setProperties] = useState({});
    const [relations, setRelations] = useState({});
    const [showButtons, setShowButtons] = useState(false);
    const [removedRelations, setRemovedRelations] = useState([]);
    const [addedRelations, setAddedRelations] = useState([]);
    const [showAddRelation, setShowAddRelation] = useState(false)

    const emptyRelation = { "from": "", "to": "", "owner": "", "direction": "uni" };
    const [newRelationData, setNewRelationData] = useState(emptyRelation)
    const { data, isLoading } = useQuery({
        queryKey: ['getState'],
        queryFn: GetState,
        enabled: true
    });

    const { mutate, isPending, isError, error, isSuccess } = useMutation({
        mutationFn: UpdateAsset, // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            refetch()
            window.alert(data.messages)
            window.location.reload()
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("Update error:", error.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Initialize a local object to accumulate changes
        let mutationObject = {};

        if (properties !== assetData.properties) {
            const formatedProperties = properties
            if (!Array.isArray(formatedProperties.Type)) {
                formatedProperties.Type = properties.Type.split(',').map(item => item.trim())
            }
            mutationObject["updateAsset"] = { [assetID]: formatedProperties };
        }

        if (removedRelations.length !== 0) {
            mutationObject["removeRelations"] = removedRelations;
        }

        if (addedRelations.length !== 0) {
            mutationObject["addRelations"] = addedRelations;
        }

        // Proceed with the mutation operation
        mutate(mutationObject);

        // Other logic...
        setShowButtons(false);
    };

    const handleReset = () => {
        setProperties(assetData.properties);
        setRelations(relationData);
        setRemovedRelations([]);
        setNewRelationData(emptyRelation);
        setAddedRelations([])
        setShowButtons(false);
    };

    const removeRelation = (rid) => {
        setShowButtons(true)
        // Update displayed relations
        const { [rid]: _, ...updatedRelations } = relations;
        setRelations(updatedRelations);

        // Removed relations
        setRemovedRelations(currentRids => [...currentRids, rid])
    }

    const handleAddRelation = () => {
        setShowAddRelation(false)
        setShowButtons(true)
        setAddedRelations(addedrelations => [...addedrelations, newRelationData])
        setNewRelationData(emptyRelation)
    }

    useEffect(() => {
        handleReset();
    }, [assetID, relationData])


    return (
        <div className='asset-info-container'>
            <div className="inputLabel">Asset ID</div>
            <h1 style={{ marginBottom: "1rem" }}>{assetID}</h1>
            <form onSubmit={handleSubmit}>

                {Object.entries(properties).map(([key, value], index) => (
                    <div key={index}>
                        {
                            !dontDisplayList.includes(key) &&
                            <div className='inputContainer'>
                                <label className='inputLabel'>{key}</label>
                                {(key === "Criticality") ?
                                    <input
                                        className="inputFields"
                                        value={value}
                                        onChange={(e) => {
                                            setProperties({ ...properties, [key]: parseInt(e.target.value, 10) || 1 });
                                            setShowButtons(true);
                                        }}
                                        id={key}
                                        type="number"
                                        min={1}
                                        max={5}
                                        name={key}
                                    />
                                    :
                                    <input
                                        className="inputFields"
                                        value={value}
                                        onChange={(e) => {
                                            setProperties({ ...properties, [key]: e.target.value });
                                            setShowButtons(true);
                                        }}
                                        id={key}
                                        type="text"
                                        name={key}
                                    />
                                }
                            </div>
                        }
                    </div>
                ))}

                <hr />

                <div >
                    <h3>Relations </h3>
                    <div className='relation-content_button'>
                        <div className="relations-container" >
                            {Object.entries(relations).map(([key, value]) => (
                                <div key={key} className='relation'>
                                    <a style={{ marginRight: "1rem" }}>{value.from}</a>
                                    <ConnectionIcon size={19} color={"var(--text-hover)"} />
                                    <a style={{ margin: "0rem 1rem" }}>{value.to}</a>
                                    <div onClick={() => removeRelation(key)}>
                                        <RemoveIcon size={22} color={"var(--error-color)"} />
                                    </div>
                                </div>

                            ))}
                            {addedRelations.map((relation, index) => (
                                <div key={index} className='relation'>
                                    <a style={{ marginRight: "1rem" }}>{relation.from}</a>
                                    <ConnectionIcon size={19} color={"var(--text-hover)"} />
                                    <a style={{ margin: "0rem 1rem" }}>{relation.to}</a>
                                    <LinkAddIcon size={22} color={"var(--success-color)"} />
                                </div>

                            ))}
                        </div>
                        {!showAddRelation &&
                            <div style={{ marginTop: "1.25rem" }} onClick={() => { setShowAddRelation(true) }}>
                                <AddIcon size={36} color={"var(--success-color)"} />
                            </div>
                        }
                        {showAddRelation &&
                            <div className='addRelation-container' style={{ marginTop: "1.25rem" }}>
                                <h3 style={{ marginBottom: "1rem" }}>Add Relation</h3>
                                {Object.entries(newRelationData).map(([key, value], index) => (
                                    <div key={index}>
                                        <div className='inputContainer'>
                                            <label className='inputLabel' style={{ marginTop: "0.5rem" }}>{`${key[0].toUpperCase()}${key.slice(1)}`}</label>
                                            {key === "from" || key === "to" ? (
                                                <Select
                                                    // // If you want to style the select box here is wher you edit: https://react-select.com/styles
                                                    styles={{
                                                        control: (baseStyles, state) => ({
                                                            ...baseStyles,
                                                            marginTop: "0.5rem",
                                                            borderStyle: 'none',
                                                            background: 'var(--background-color)',
                                                            fontFamily: 'Jetbrains Mono',
                                                        }),
                                                        option: (baseStyles, state) => ({
                                                            ...baseStyles,
                                                            backgroundColor: 'var(--background-color)',
                                                            color: 'var(--text-color)',
                                                            cursor: 'pointer',
                                                            fontFamily: "Jetbrains Mono"
                                                        }),
                                                        placeholder: (baseStyles, state) => ({
                                                            ...baseStyles,
                                                            backgroundColor: 'var(--background-color)',
                                                            color: 'var(--text-color)',
                                                            cursor: 'pointer',
                                                            fontFamily: "Jetbrains Mono"
                                                        }),
                                                        singleValue: (baseStyles, state) => ({
                                                            ...baseStyles,
                                                            backgroundColor: 'var(--background-color)',
                                                            color: 'var(--text-color)',
                                                            cursor: 'pointer',
                                                            fontFamily: "Jetbrains Mono"
                                                        }),


                                                    }}
                                                    value={assetIDs.find(option => option.value === value)}
                                                    onChange={(option) => setNewRelationData({ ...newRelationData, [key]: option.value })}
                                                    options={assetIDs.map(id => ({ value: id, label: id }))}
                                                    placeholder="Select an Asset ID"
                                                    isSearchable={true}
                                                    id={key}
                                                    name={key}
                                                />
                                            ) : (key === "direction" ? <select
                                                className="inputFields"
                                                value={value}
                                                onChange={(e) => setNewRelationData({ ...newRelationData, [key]: e.target.value })}
                                                id={key}
                                                name={key}
                                            >
                                                <option value="uni">Unidirectional</option>
                                                <option value="bi">Bidirectional</option>
                                            </select>
                                                :
                                                (
                                                    <input
                                                        className="inputFields"
                                                        value={value}
                                                        onChange={(e) => setNewRelationData({ ...newRelationData, [key]: e.target.value })}
                                                        id={key}
                                                        type="text"
                                                        name={key}
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="standard-button-container">
                                    <div style={{ marginRight: "2rem" }} onClick={handleAddRelation}>
                                        <CheckIcon size={35} color={"var(--success-color)"} />
                                    </div>
                                    <div onClick={() => setShowAddRelation(false)}>
                                        <CrossIcon size={35} color={"var(--error-color)"} />
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
                {showButtons &&
                    <div className="standard-button-container">
                        <button className="standard-button" disabled={isPending} type="submit">Save</button>
                        <button className="standard-button" disabled={isPending} onClick={handleReset}>Cancel</button>
                    </div>

                }

                <hr />

                {isPending && <LoadingSpinner />}
                {isError && <div className='errorMessage'>{error.message}</div>}
                {errorMessage && <div className='errorMessage'>{errorMessage}</div>}
            </form>
        </div>
    )
}
