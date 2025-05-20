const User = require("../models/UserModel.js");
const jwt = require("jsonwebtoken");

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      console.log("No refresh token in cookies");
      return res.status(401).json({ message: "No refresh token" });
    }

    const user = await User.findOne({
      where: {
        refresh_token: refreshToken,
      },
    });

    if (!user) {
      console.log("No user found with this refresh token");
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          console.log("JWT verification failed:", err.message);
          return res.status(403).json({ message: "Invalid refresh token" });
        }

        const userPlain = user.toJSON();
        const { password: _, refresh_token: __, ...safeUserData } = userPlain;

        const accessToken = jwt.sign(
          safeUserData,
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "30s",
          }
        );

        res.json({ accessToken });
      }
    );
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
