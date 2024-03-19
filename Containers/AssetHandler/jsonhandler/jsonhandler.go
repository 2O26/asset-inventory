package jsonhandler

import (
	"encoding/json"
	"errors"
)

type Asset struct {
	Name        string   `json:"Name"`
	Owner       string   `json:"Owner"`
	Type        []string `json:"Type"` // array with type -> subtype -> sub-subtype, etc
	DateCreated string   `json:"Created at"`
	DateUpdated string   `json:"Updated at"`
	Criticality int      `json:"Criticality"`
	Hostname    string   `json:"Hostname"`
}

type FrontAsset struct {
	Asset   `json:"properties"`
	Plugins map[string]any `json:"plugins"`
}

type Plugin struct {
	PluginStateID string `json:"pluginStateID"`
}

// Relation 'Relations will stay the same between front and back data'
type Relation struct {
	From        string `json:"from"`
	To          string `json:"to"`
	Direction   string `json:"direction"`
	Owner       string `json:"owner"`
	DateCreated string `json:"dateCreated"`
}

type BackState struct {
	MostRecentUpdate string              `json:"mostRecentUpdate"`
	Assets           map[string]Asset    `json:"assets"`
	Plugins          map[string]Plugin   `json:"plugins"`
	Relations        map[string]Relation `json:"relations"`
}

type FrontState struct {
	MostRecentUpdate string                `json:"mostRecentUpdate"`
	Assets           map[string]FrontAsset `json:"assets"`
	Relations        map[string]Relation   `json:"relations"`
	PluginList       []string              `json:"pluginList"`
}

type PluginState struct {
	StateID     string         `json:"stateID"`
	DateCreated string         `json:"dateCreated"`
	DateUpdated string         `json:"dateUpdated"`
	State       map[string]any `json:"state"`
}

// BackToFront Takes a state, an arbitrary amount of plugin names and plugin data and formats the output to the style used in frontend.
// Only one plugins map should be sent to the function.
func BackToFront(assetState json.RawMessage, plugins map[string]json.RawMessage) (json.RawMessage, error) {

	var in BackState
	var out FrontState

	outAssets := make(map[string]FrontAsset)

	err := json.Unmarshal(assetState, &in)
	if err != nil {
		return nil, errors.New("could not unmarshal assetState JSON")
	}

	// copy stuff here
	out.MostRecentUpdate = in.MostRecentUpdate

	out.Relations = in.Relations
	copyAssets(in.Assets, outAssets) //written by Gemini

	if plugins != nil {
		//need to unmarshal all pluginStates
		pluginStates := make(map[string]PluginState)

		for key, value := range plugins {
			out.PluginList = append(out.PluginList, key)
			var temp PluginState

			err := json.Unmarshal(value, &temp)
			if err != nil {
				return nil, errors.New("could not unmarshal pluginState json")
			}

			pluginStates[key] = temp
		}

		//All pluginStates have been unmarshalled, can now copy
		insertPluginData(outAssets, pluginStates)
	}

	out.Assets = outAssets //need to put output in out.assets as indices can't be modified

	toPrint, err := json.Marshal(out)

	return toPrint, err

}

// Copies assets from Asset struct to FrontAsset struct.
func copyAssets(inAssets map[string]Asset, outAssets map[string]FrontAsset) {
	for name, asset := range inAssets {

		outAsset := FrontAsset{
			Asset:   asset,                // Embed the original Asset data directly
			Plugins: make(map[string]any), // Initialize the Plugins map
		}
		outAssets[name] = outAsset
	}
}

func insertPluginData(inAssets map[string]FrontAsset, plugins map[string]PluginState) {
	for pluginName, pluginState := range plugins {
		for pluginAssetName, pluginAsset := range pluginState.State {
			asset, found := inAssets[pluginAssetName]
			if found {
				// If a Plugins map already exists, merge with existing data
				if asset.Plugins == nil {
					asset.Plugins = map[string]any{}
				}
				asset.Plugins[pluginName] = pluginAsset.(map[string]any)
			} else {
				// If not found, create a new entry with plugin data
				inAssets[pluginAssetName] = FrontAsset{
					Asset:   asset.Asset,
					Plugins: map[string]any{pluginName: pluginAsset.(map[string]any)},
				}
			}
		}
	}
}