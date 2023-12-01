import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { Button, TextField, CircularProgress, Box, Typography, Link, Container, Grid, Paper } from '@mui/material';

interface SitecoreContext {

  }

  interface Asset {
    title: string;
    id: string;
    preview?: string;
}

const SitecoreAssetsSearch = ({ context }: { context: SitecoreContext }) => {
    const [userInput, setUserInput] = useState('');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');


    // Function to interpret user query using OpenAI
    const interpretUserQuery = async (query: string) => {
        const openAIEndpoint = "https://api.openai.com/v1/engines/text-davinci-003/completions";
        const openAIKey = "sk-YOUR_API_KEY";

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAIKey}`
        };

    const data = {
        prompt: `
        Context: 
        Develop a Sitecore Content Hub API query based on user input. Utilize sorting, filtering, full-text search, and operators like '==', '!=', 'gt', 'gte', 'lt', 'lte', 'AND', 'OR'. Reference the Sitecore documentation for comprehensive querying capabilities.
    
        Documentation References:
        - Query formats: https://doc.sitecore.com/ch/en/developers/cloud-dev/rest-api--query.html
        - Generic properties: https://doc.sitecore.com/ch/en/developers/cloud-dev/rest-api--generic-properties.html
        - Specific properties: https://doc.sitecore.com/ch/en/developers/cloud-dev/rest-api--specific-properties.html
        - Factors influencing queries: https://doc.sitecore.com/ch/en/developers/cloud-dev/rest-api--factors.html
        - Full-text search capabilities: https://doc.sitecore.com/ch/en/developers/cloud-dev/rest-api--full-text.html
        - Using negation in queries: https://doc.sitecore.com/ch/en/developers/cloud-dev/rest-api--negating.html
        - Operators: https://doc.sitecore.com/ch/en/developers/cloud-dev/rest-api--operators.html
        - Relationships in queries: https://doc.sitecore.com/ch/en/developers/cloud-dev/rest-api--relations.html

        Database Schema Overview:
        - Assets with fields like id, title, type, creationDate, creator, status.
        - Relationships such as AssetToCampaign, AssetToCollection, AssetToUser, etc.
        - Entities like Campaign, Collection, User, with fields like id, title, type.

        User Query: "${query}"

        Task:
        Construct a Sitecore Content Hub API query tailored to the user's input. Aim to retrieve relevant 'Assets' data, leveraging the query capabilities and database schema detailed above.
    
        Example Queries from Documentation:
        - For the latest 5 assets: Definition.Name=='M.Asset'&sort=CreationDate:desc&take=5
        - For assets with a specific title: Definition.Name=='M.Asset' AND String('Title')=='Specific Title'
        - For conducting a full-text search within assets: Definition.Name=='M.Asset' AND FullText=='search term'
        - For conducting search on file extension: Definition.Name=='M.Asset' AND String('FileExtension')=='file extention'
        - For asset between two modified dates: Definition.Name=='M.Asset' AND Date('Modified')>=2023-01-01 AND Date('Modified')<=2023-12-31
        - For assets by Tag name: Definition.Name=='M.Asset' AND Relations('Tags', 'TagName')=='SpecificTag'
        - For assets by Authors name: Definition.Name=='M.Asset' AND String('Author')=='Author Name'
        - Query for Assets in a Specific Collection: Definition.Name=='M.Asset' AND Relations('CollectionName')=='My Collection'
        - Query for Assets with Certain Metadata: Definition.Name=='M.Asset' AND String('MetadataFieldName')=='Metadata Value'
        - Query for Assets by File Size Range: Definition.Name=='M.Asset' AND Number('FileSize')>=1000 AND Number('FileSize')<=5000
        - Query for Assets with Specific Resolution: Definition.Name=='M.Asset' AND Number('Width')==1920 AND Number('Height')==1080
        - Query for Assets Uploaded by a Specific User: Definition.Name=='M.Asset' AND String('UploadedBy')=='Username'
        - Query for Assets with a Specific Status: Definition.Name=='M.Asset' AND String('Status')=='Approved'
        - Query for Assets with Multiple Conditions: Definition.Name=='M.Asset' AND String('FileExtension')=='jpg' AND Date('Created')>=2023-01-01 AND String('Status')=='Approved'
        - Query for Assets by Title with Specific Type and Status: Definition.Name=='M.Asset' AND String('Title')=='Specific Title' AND String('Type')=='Asset Type' AND String('Status')=='Asset Status'
        - Full-Text Search within Assets Including Creator: Definition.Name=='M.Asset' AND FullText=='search term' AND String('created_by')=='Creator Name'

        Your Goal: Generate an accurate Sitecore Content Hub API query based on the provided User Query.
        `,
        max_tokens: 100
    };

        try {
            const response = await axios.post(openAIEndpoint, data, { headers });
            let interpretedQuery = response.data.choices[0].text.trim();

            console.log('Original interpreted query:', interpretedQuery);

            // Remove any text before the first colon (including the colon itself)
            const colonIndex = interpretedQuery.indexOf(':');
            if (colonIndex !== -1) {
                interpretedQuery = interpretedQuery.substring(colonIndex + 1).trim();
            }

            console.log('Cleaned interpreted query:', interpretedQuery);
            return interpretedQuery;
        } catch (error) {
            console.error('Error interpreting user query:', error);
            throw error;
        }
    };

    // Function to fetch assets from Sitecore Content Hub
    const fetchAssets = async (query: string | number | boolean) => {
        setIsLoading(true);

        // Adjust the endpoint and query format according to Content Hub setup
        //This could also be a graphQL query to make it simpler
        const contentHubEndpoint = "https://YOUR_CONTENT_HUB/api/entities/query";
        const fullUrl = `${contentHubEndpoint}?query=${query}`;

        console.log(fullUrl);

        try {
            const response = await axios.get(fullUrl);
            console.log('Full API response:', response);
    
            if (!response.data || !response.data.items || !Array.isArray(response.data.items)) {
                console.error('Unexpected response structure:', response.data);
                setError('Unexpected response structure.');
                setIsLoading(false);
                return;
            }
    
            const items = response.data.items;
            const formattedAssets = items.slice(0, 5).map((item: { id: { toString: () => any; }; properties: { Title: any; }; renditions: { downloadOriginal: [{ href: string }]; downloadAlternative: [{ href: string }]; }; }) => ({
                id: item.id.toString(),
                title: item.properties.Title || 'No Title',
                preview: item.renditions.downloadOriginal?.[0]?.href || item.renditions.downloadAlternative?.[0]?.href || 'No Preview'
            }));
    
            console.log('Formatted assets:', formattedAssets);
            setAssets(formattedAssets);
            setSuccessMessage('Assets fetched successfully');
        } catch (error) {
            const axiosError = error as AxiosError;
            if (axiosError.config && axiosError.config.url) {
                console.log("Failed URL:", axiosError.config.url);
            }
            console.error("Error fetching assets from Content Hub", axiosError);
            setError('Failed to fetch assets. Please try again.');
        }
    
        setIsLoading(false);
    };

    // Function to handle user input
    const handleUserRequest = async () => {
        setError('');
        setSuccessMessage('');
        try {
            const interpretedQuery = await interpretUserQuery(userInput);
            await fetchAssets(interpretedQuery);
            setSuccessMessage('Assets fetched successfully');
        } catch (err) {
            setError('Failed to fetch assets. Please try again.');
        }
    };

    const clearSearch = () => {
        setUserInput('');
        setAssets([]);
        setError('');
        setSuccessMessage('');
    };

    return (
        <Container>
            <Paper elevation={3} sx={{ p: 2, my: 2 }}>
                <Typography variant="h4" gutterBottom>
                    AI-Powered Sitecore Search Assistant
                </Typography>
                <Box component="form" noValidate autoComplete="off">
                    <TextField
                        fullWidth
                        label="Enter your query"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        margin="normal"
                        variant="outlined"
                    />
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item>
                            <Button variant="contained" color="primary" onClick={handleUserRequest} disabled={isLoading}>
                                {isLoading ? <CircularProgress size={24} /> : 'Search'}
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button variant="contained" color="secondary" onClick={clearSearch} disabled={isLoading}>
                                Clear
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
                {error && <Typography color="error">{error}</Typography>}
                {successMessage && <Typography color="success.main">{successMessage}</Typography>}
                <Box sx={{ mt: 2 }}>
                    {assets.map((asset, index) => {
                        const titleLower = asset.title ? asset.title.toLowerCase() : '';
                        if (titleLower.includes('zip') || titleLower.includes('xml') || titleLower.includes('txt') || titleLower.includes('mp4')) {
                            return null;
                        }

                        return (
                            <Paper key={index} elevation={2} sx={{ p: 2, mb: 2 }}>
                                <Typography variant="h6"><b>{asset.title || 'N/A'}</b></Typography>
                                <Typography variant="body1">
                                    <b>Asset ID:</b> {asset.id ? <Link href={`https://YOUR_CONTEN_HUB/en-us/asset/${asset.id}`} target="_blank">{asset.id}</Link> : 'N/A'}
                                </Typography>
                                {asset.preview && <img src={asset.preview} alt={asset.title} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', marginTop: '10px' }} />}
                            </Paper>
                        );
                    })}
                </Box>
            </Paper>
        </Container>
    );
};

export default SitecoreAssetsSearch;
