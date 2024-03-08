package jsonhandler

import (
	"encoding/json"
	"testing"

	"github.com/wI2L/jsondiff"
)

func TestBackToFrontNoPlugin(t *testing.T) {
	in := `{
		"mostRecentUpdate": "2024-02-14 23:35:53",
		"assets": {
			"AID_4123523": {
				"Name": "PC-A",
				"Owner": "UID_2332",
				"Type": ["Computer", "Desktop"],
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 2,
				"Hostname": "Desktop-123"
			},
			"AID_5784393": {
				"Name": "Chromecast",
				"Owner": "UID_2332",
				"Type": ["IoT", "Media"],
				"Created at": "2024-02-10 20:04:20",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 1,
				"Hostname": "LivingRoom"
			},
			"AID_9823482": {
				"Name": "Password Vault",
				"Owner": "UID_2332",
				"Type": ["Server", "Database"],
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 4
			}
		},
		"plugins": {
			"ipScan": {
				"pluginStateID": "20240214-1300A"
			},
			"macScan": {
				"pluginStateID": "20240215-0800G"
			}
		},
		"relations": {
			"RID_2613785": {
				"from": "ID_4123523",
				"to": "ID_5784393",
				"direction": "uni",
				"owner": "UID_2332",
				"dateCreated":"2024-02-14 23:35:53"
			},
			"RID_6492733": {
				"from": "ID_5784393",
				"to": "ID_9823482",
				"direction": "bi",
				"owner": "UID_6372",
				"dateCreated": "2024-01-22 07:32:32"
			}    
		}    
	}
	`
	want := `{
		"mostRecentUpdate": "2024-02-14 23:35:53",
		"pluginList": null,
		"assets": {
			"AID_4123523": {
				"properties": {
					"Name": "PC-A",
					"Owner": "UID_2332",
					"Type": ["Computer", "Desktop"],	
					"Created at": "2024-02-14 23:00:00",
					"Updated at": "2024-02-14 23:00:30",
					"Criticality": 2,
					"Hostname": "Desktop-123"
				},
				"plugins": {}
			},
			"AID_5784393": {
				"properties": {
					"Name": "Chromecast",
					"Owner": "UID_2332",
					"Type": ["IoT", "Media"],
					"Created at": "2024-02-10 20:04:20",
					"Updated at": "2024-02-14 23:00:30",
					"Criticality": 1,
					"Hostname": "LivingRoom"
				},
				"plugins": {}
			},
			"AID_9823482": {
				"properties": {
					"Name": "Password Vault",
					"Owner": "UID_2332",
					"Type": ["Server", "Database"],
					"Created at": "2024-02-14 23:00:00",
					"Updated at": "2024-02-14 23:00:30",
					"Criticality": 4,
					"Hostname": ""
				},
				"plugins": {}
			}
		},
		"relations": {
			"RID_2613785": {
				"from": "ID_4123523",
				"to": "ID_5784393",
				"direction": "uni",
				"owner": "UID_2332",
				"dateCreated": "2024-02-14 23:35:53"
			},
			"RID_6492733": {
				"from": "ID_5784393",
				"to": "ID_9823482",
				"direction": "bi",
				"owner": "UID_6372",
				"dateCreated": "2024-01-22 07:32:32"
			}
		}
	}`

	out, err := BackToFront(json.RawMessage(in), nil)
	diff, err2 := jsondiff.Compare(out, json.RawMessage(want))
	if err != nil || err2 != nil || diff != nil {
		t.Fatalf("Input did not create correct output. Difference is %s. Error1: %s. Error2: %s", diff.String(), err, err2)
	}

}

func TestBackToFrontBadPlugin(t *testing.T) {
	in := `{
		"mostRecentUpdate": "2024-02-14 23:35:53",
		"assets": {
			"AID_4123523": {
				"Name": "PC-A",
				"Owner": "UID_2332",
				Type": ["Computer", "Desktop"],	
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 2        
			},
			"AID_5784393": {
				"Name": "Chromecast",
				"Owner": "UID_2332",
				"Type": ["IoT", "Media"],
				"Created at": "2024-02-10 20:04:20",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 1
			},
			"AID_9823482": {
				"Name": "Password Vault",
				"Owner": "UID_2332",
				"Type": ["Server", "Database"],
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 4
			}
		},
		"plugins": {},
		"relations": {
			"RID_2613785": {
				"from": "ID_4123523",
				"to": "ID_5784393",
				"direction": "uni",
				"owner": "UID_2332",
				"dateCreated":"2024-02-14 23:35:53"
			},
			"RID_6492733": {
				"from": "ID_5784393",
				"to": "ID_9823482",
				"direction": "bi",
				"owner": "UID_6372",
				"dateCreated": "2024-01-22 07:32:32"
			}    
		}    
	}
	`

	plugin := make(map[string]json.RawMessage)
	plugin["netscan"] = json.RawMessage(`{
		"stateID": "20240214-1300A",
		"dateCreated": "2024-02-14 23:00:00"
		"dateUpdated": "2024-02-14 23:00:30",
		"state": {
			"AID_412523": {
				"Status": "up",
				"IPV4 Address": "192.168.1.1"
				"IPV6 Address": "10:25:96:12:34:56",
				"Subnet": "192.168.1.0/24"
			},
			"AID_5784393": {
				"Status": "down",
				"IPV4 Address": "172.168.1.1",
				"IPV6 Address": "20:25:96:12:34:56",
				"Subnet": "192.168.1.0/24"
			}
		}
	}`)

	out, err := BackToFront(json.RawMessage(in), plugin)

	if err == nil {
		t.Fatalf("Invalid input did not create error. Output %s. Error: %s.", out, err)
	}

}

func TestBackToFrontValidData(t *testing.T) {
	in := `{
		"mostRecentUpdate": "2024-02-14 23:35:53",
		"assets": {
			"AID_4123523": {
				"Name": "PC-A",
				"Owner": "UID_2332",
				"Type": ["Computer", "Desktop"],
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 2,
				"Hostname": "Desktop-123"
			},
			"AID_5784393": {
				"Name": "Chromecast",
				"Owner": "UID_2332",
				"Type": ["IoT", "Media"],
				"Created at": "2024-02-10 20:04:20",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 1,
				"Hostname": "LivingRoom"
			},
			"AID_9823482": {
				"Name": "Password Vault",
				"Owner": "UID_2332",
				"Type": ["Server", "Database"],
				"Created at": "2024-02-14 23:00:00",
				"Updated at": "2024-02-14 23:00:30",
				"Criticality": 4
			}
		},
		"plugins": {
			"netscan": {
				"pluginStateID": "20240214-1300A"
			},
			"osscan": {
				"pluginStateID": "20240417-1400B"
			}
		},
		"relations": {
			"RID_2613785": {
				"from": "AID_4123523",
				"to": "AID_5784393",
				"direction": "uni",
				"owner": "UID_2332",
				"dateCreated":"2024-02-14 23:35:53"
			},
			"RID_6492733": {
				"from": "AID_5784393",
				"to": "AID_9823482",
				"direction": "bi",
				"owner": "UID_6372",
				"dateCreated": "2024-01-22 07:32:32"
			}    
		}    
	}
	`
	var netscan = json.RawMessage(`
	{
		"stateID": "20240214-1300A",
		"dateCreated": "2024-02-14 23:00:00",
		"dateUpdated": "2024-02-14 23:00:30",
		"state": {
			"AID_4123523": {
				"Status": "up",
				"IPV4 Address": "192.168.1.1",
				"IPV6 Address": "10:25:96:12:34:56",
				"Subnet": "192.168.1.0/24"
			},
			"AID_5784393": {
				"Status": "down",
				"IPV4 Address": "172.168.1.1",
				"IPV6 Address": "20:25:96:12:34:56",
				"Subnet": "192.168.1.0/24"
			}
		}
	}`)
	plugin := make(map[string]json.RawMessage)
	plugin["netscan"] = netscan
	var osscan = json.RawMessage(`
	{
		"stateID": "20240417-1400B",
		"dateCreated": "2024-02-30 23:00:00",
		"dateUpdated": "2024-02-31 23:00:30",
		"state": {
			"AID_4123523": {
				"OS": "Windows XP"
			}
		}
	}`)

	plugin["osscan"] = osscan

	want := `{
		"assets": {
			"AID_4123523": {
				"plugins": {
					"netscan": {
						"IPV4 Address": "192.168.1.1",
						"IPV6 Address": "10:25:96:12:34:56",
						"Status": "up",
						"Subnet": "192.168.1.0/24"
					},
					"osscan": {
						"OS": "Windows XP"
					}
				},
				"properties": {
					"Criticality": 2,
					"Created at": "2024-02-14 23:00:00",
					"Updated at": "2024-02-14 23:00:30",
					"Name": "PC-A",
					"Owner": "UID_2332",
					"Type": ["Computer", "Desktop"],
					"Hostname": "Desktop-123"
				}
			},
			"AID_5784393": {
				"plugins": {
					"netscan": {
						"IPV4 Address": "172.168.1.1",
						"IPV6 Address": "20:25:96:12:34:56",
						"Status": "down",
						"Subnet": "192.168.1.0/24"
					}
				},
				"properties": {
					"Criticality": 1,
					"Created at": "2024-02-10 20:04:20",
					"Updated at": "2024-02-14 23:00:30",
					"Name": "Chromecast",
					"Owner": "UID_2332",
					"Type": ["IoT", "Media"],
					"Hostname": "LivingRoom"
				}
			},
			"AID_9823482": {
				"plugins": {
				},
				"properties": {
					"Criticality": 4,
					"Created at": "2024-02-14 23:00:00",
					"Updated at": "2024-02-14 23:00:30",
					"Name": "Password Vault",
					"Owner": "UID_2332",
					"Type": ["Server", "Database"],
					"Hostname": ""
				}
			}
		},
		"mostRecentUpdate": "2024-02-14 23:35:53",
		"pluginList": [
			"netscan",
			"osscan"
		],
		"relations": {
			"RID_2613785": {
				"dateCreated": "2024-02-14 23:35:53",
				"direction": "uni",
				"from": "AID_4123523",
				"owner": "UID_2332",
				"to": "AID_5784393"
			},
			"RID_6492733": {
				"dateCreated": "2024-01-22 07:32:32",
				"direction": "bi",
				"from": "AID_5784393",
				"owner": "UID_6372",
				"to": "AID_9823482"
			}
		}
	}`

	out, err := BackToFront(json.RawMessage(in), plugin)
	diff, err2 := jsondiff.Compare(out, json.RawMessage(want))

	if err != nil || err2 != nil || diff != nil {
		t.Fatalf("Input did not create correct output. Difference is %s. Error: %s. Error2: %s. Output JSON for debugging: %s", diff.String(), err, err2, string(out))
	}

}

func TestBackToFrontEmpty(t *testing.T) {
	out, err := BackToFront(nil, nil)
	if err == nil {
		t.Fatalf(`BackToFront("") = %q, %v, want "", error`, out, err)
	}
}
