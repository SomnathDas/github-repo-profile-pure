import { Octokit } from "https://esm.sh/octokit";

/* Please enter your own Personal access tokens (classic) */
const octokit = new Octokit({ auth: `ENTER_YOUR_OWN_TOKEN` });

/* Getting User Profile which was queried */
const getUserProfile = async (username) => {
    /* Turning on the loader */
    document.getElementById("loader").style = "display: flex"
    const uProfile = await octokit.request(`GET /users/${username}`, {
        username: username,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    try {
        const avatarSrc = uProfile['data']['avatar_url'];
        const login = uProfile['data']['login'];
        const name = uProfile['data']['name'];
        const bio = uProfile['data']['bio'];
        const followers = uProfile['data']['followers'];
        const following = uProfile['data']['following'];
        const location = uProfile['data']['location'];
        const twitter_username = uProfile['data']['twitter_username'];
        /* Setting User Profile Image */
        const profileImg = document.getElementById("u-img");
        profileImg['src'] = avatarSrc;
        /* Setting name and login */
        const profileName = document.getElementById("name");
        const profileLogin = document.getElementById("login");
        profileName.innerText = name;
        profileLogin.innerText = login;
        /* Setting bio */
        const profileBio = document.getElementById("bio");
        profileBio.innerText = bio;
        /* Setting followers and following */
        const profileFollowers = document.getElementById("followers");
        const profileFollowing = document.getElementById("following");
        profileFollowers.innerText = `${followers}`
        profileFollowing.innerText = `${following}`
        /* Setting location, twitter and link */
        const profileLocation = document.getElementById("location");
        const profileSocial = document.getElementById("social");
        if (location === null) {
            document.getElementsByClassName("location-parent")[0].style = "display: none;"
        } else {
            profileLocation.innerText = location
        }
        const profileTwitter = document.getElementById("twitter");
        if (twitter_username === null) {
            document.getElementsByClassName("twitter-parent")[0].style = "display: none;"
        } else {
            profileTwitter['href'] = `https://twitter.com/${twitter_username}`;
            profileTwitter.innerText = twitter_username;
        }
        profileSocial['href'] = `https://github.com/${username}`;
        profileSocial.innerText = `https://github.com/${username}`;

        /* Removing Loader*/
        document.getElementById("loader").style = "display: none"
    } catch (err) {
        console.error(err)
    }
}

/* Get total number of pages assuming each page will have 10 repos */
const getTotalPages = async (username) => {
    /* Regex to match for the ;rel=last expression in the header.link*/
    const nextPattern = /(?<=<)([\S]*)(?=>; rel="last")/i;
    const { headers } = await octokit.request(`GET /users/${username}/repos`, {
        owner: "SomnathDas",
        per_page: 10,
        headers: {
            "X-GitHub-Api-Version": "2022-11-28",
        },
    });

    let lastPageNumber = 0;
    if (headers.link === undefined) {
        lastPageNumber = 1
    } else {
        let lastPage = headers.link.match(nextPattern)[0].split("=");
        lastPageNumber = Number(lastPage[lastPage.length - 1])
    }

    return lastPageNumber
}

/* Getting repos from the given username */
const getUserRepos = async (username, currentPage) => {
    /* Turning on the loader */
    document.getElementById("loader").style = "display: flex"
    const { data } = await octokit.request(`GET /users/${username}/repos`, {
        username: username,
        per_page: 10,
        page: currentPage,
        sort: "created",
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    /* Getting parent body */
    let pBody = document.getElementById("repos-parent");

    try {
        // data -> array of repos
        /* Gathering information from repo */
        data.map((repo) => {
            let divContainer = document.createElement("div");
            divContainer.classList = ["repo-box"]

            let topicsContainer = document.createElement("div");
            topicsContainer.classList = ["topics-container"]
            repo['topics'].map((topic) => {
                let span = document.createElement("span");
                span.innerText = topic
                span.classList = ["topic-label"]

                topicsContainer.appendChild(span)
            })

            let h2 = document.createElement("h2");
            /* Sink Here, make sure it is clear */
            h2.innerHTML = `<a href=https://github.com/${username}/${repo['name']}>${repo['name']}</a>`

            let h3 = document.createElement("h3");
            h3.innerText = repo['description'];

            divContainer.appendChild(h2);
            divContainer.appendChild(h3);
            divContainer.appendChild(topicsContainer)

            pBody.appendChild(divContainer)
        })

        /* Creating Page number based navigation at the bottom of repo-section*/
        let lastPageNumber = await getTotalPages(username);
        let bottomNavDiv = document.getElementsByClassName("bottom-navbar")[0];
        for (let i = 0; i < lastPageNumber; i++) {
            let navLink = document.createElement("a");
            navLink.classList = ["bottom-nav-link"];
            navLink.innerText = i + 1;

            /* Handling Pagination Events */
            navLink.onclick = (e) => {
                pBody.innerHTML = ""
                bottomNavDiv.innerHTML = ""
                getUserRepos(username, e.target.innerText)
            }

            bottomNavDiv.appendChild(navLink)
        }
        let bottomNavLinks = document.getElementsByClassName("bottom-nav-link");
        bottomNavLinks[currentPage - 1].classList.add("link-active")

        /* Removing Loader*/
        document.getElementById("loader").style = "display: none"

    } catch (err) {
        console.error(err)
    }
}

const getAllRepos = async (username, keyword) => {
    const data = await octokit.paginate(`GET /users/${username}/repos`, {
        username: username,
        sort: "created",
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    let filteredData = data.filter((repo) => repo['name'].toLowerCase().includes(keyword))
    return filteredData
}

/* Handling Search Events */
const searchBtn = document.getElementById("search-btn")
const searchEvent = async (username) => {
    /* Getting parent body */
    let pBody = document.getElementById("repos-parent");
    /* Starting Loader */
    let repoLoader = document.getElementsByClassName("repo-loader")[0];
    pBody.style = "display: none;"
    repoLoader.style = "display: flex;"
    /* Starting Loader */
    const searchBar = document.getElementById("search")
    let filtered = await getAllRepos(username, searchBar.value)
    /* Finishing Loader */
    repoLoader.style = "display: hidden;"
    pBody.style = "display: block;"
    pBody.innerHTML = ""
    for (let i = 0; i < 10; i++) {
        if (filtered.length < 1) {
            let pErr = document.createElement("p");
            pErr.innerText = "No Such Repository Found...!"

            pBody.appendChild(pErr);
        }
        if (filtered[i] == null || filtered[i] == undefined) {
            return
        } else {
            let repo = filtered[i]
            let divContainer = document.createElement("div");
            divContainer.classList = ["repo-box"]

            let topicsContainer = document.createElement("div");
            topicsContainer.classList = ["topics-container"]
            repo['topics'].map((topic) => {
                let span = document.createElement("span");
                span.innerText = topic
                span.classList = ["topic-label"]

                topicsContainer.appendChild(span)
            })

            let h2 = document.createElement("h2");
            /* Sink Here, make sure it is clear */
            h2.innerHTML = `<a href=https://github.com/${username}/${repo['name']}>${repo['name']}</a>`

            let h3 = document.createElement("h3");
            h3.innerText = repo['description'];

            divContainer.appendChild(h2);
            divContainer.appendChild(h3);
            divContainer.appendChild(topicsContainer)

            pBody.appendChild(divContainer)
        }
    }
}

/* You can replace "SomnathDas" with any valid github login */
searchBtn.addEventListener("click", () => searchEvent("SomnathDas"))
getUserProfile("SomnathDas");
getUserRepos("SomnathDas", 1);