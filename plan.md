# Copy Tool


## Workflow
1. Add a marketing Deck / Copy Strategy 
2. Select the channel for which to create the campaign
3. Select the contents / structure of the marketing campaign for each structure (Teaser, Hype, Unveil, Start, Engagement, Last Chance)


## Structure (json - for using on the frontend) 

#### Channels :
    {
        'name': "Email",
        'prompt': "Email Marketing"
        'touchpoints': [{'name':"Teaser", purpose:"..."}, "Unveil", "Hype", "Start Orders", "Engagement", "Last Chance", "Custom"] // the whole object of a touchpoint
    }

#### Touchpoints:
    {
        'name': 'Teaser',
        'purpose': 'Build anticipation for the launch'
        (optional) 'target': "Leads/Existent/Both"
    }

#### Improvement Prompt:

    {
        'text': "First text",
        'improvement': "Make it ..."
    }


### Prompt Responses:

#### Campaign:

    {
        'channel': 'Organic',
        'content': [
            {
                'touchpoint': "Teaser",
                'copies': ["...", "..." "..."]
            }, ...

        ]

    }

#### Improvement:
     only the text with the new copy


## Prototype improvements 

- Hold each generated campaign in a separate page (in the library section)
- 





