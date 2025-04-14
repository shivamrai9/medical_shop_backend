import sendEmail from '../config/sendEmail.js'
import UserModel from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js'
import generatedAccessToken from '../utils/generatedAccessToken.js'
import genertedRefreshToken from '../utils/generatedRefreshToken.js'
import uploadImageClodinary from '../utils/uploadImageClodinary.js'
import generatedOtp from '../utils/generatedOtp.js'
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js'
import jwt from 'jsonwebtoken'
import e from 'express'
import mongoose from 'mongoose'

export async function registerUserController(req, res) {
  try {
    const { name, email, password, mobile ,role} = req.body;

    // Validate required fields
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({
        message: "Provide name, email, password, and mobile",
        error: true,
        success: false,
      });
    }

    // Normalize email & mobile
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedMobile = mobile.trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email format",
        error: true,
        success: false,
      });
    }

    // Validate mobile number (Only digits, 10-15 characters)
    const mobileRegex = /^\d{10,15}$/;
    if (!mobileRegex.test(normalizedMobile)) {
      return res.status(400).json({
        message: "Invalid mobile number",
        error: true,
        success: false,
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
        error: true,
        success: false,
      });
    }


    // Create new user
    const newUser = new UserModel({
      name,
      email: normalizedEmail,
      password,
      mobile: normalizedMobile,
      role: role || "USER",
    });

    // Save user to database
    const savedUser = await newUser.save();

    // Generate verification URL
    const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${savedUser._id}`;

    // Send verification email
    try {
      await sendEmail({
        sendTo: normalizedEmail,
        subject: "Verify Your Email - MediShop",
        html: verifyEmailTemplate({
          name,
          url: verifyEmailUrl,
        }),
      });
      console.log("Verification email sent successfully");
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError.message);
    }

    // Return success response
    return res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      error: false,
      success: true,
      data: { _id: savedUser._id, email: savedUser.email ,verifyEmailUrl},
    });
  } catch (error) {
    console.error("Error in registerUserController:", error);
    return res.status(500).json({
      message: error.message || "Server error during registration",
      error: true,
      success: false,
    });
  }
}

export async function verifyEmailController(request, response) {
  try {
    const { code } = request.body;

    // ✅ 1. Validate Input
    if (!code || !mongoose.Types.ObjectId.isValid(code)) {
      return response.status(400).json({
        message: "Invalid or missing verification code",
        error: true,
        success: false,
      });
    }

    // ✅ 2. Find and Update the User
    const user = await UserModel.findById(code);

    if (!user) {
      return response.status(400).json({
        message: "Invalid verification code",
        error: true,
        success: false,
      });
    }

    // ✅ 3. Check if the Email is Already Verified
    if (user.verify_email) {
      return response.status(200).json({
        message: "Email is already verified",
        success: true,
        error: false,
      });
    }

    // ✅ 4. Update Verification Status
    await UserModel.findByIdAndUpdate(
      code,
      { verify_email: true, last_login_date: new Date() },
      { new: true }
    );

    return response.status(200).json({
      message: "Email verified successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error during email verification",
      error: true,
      success: false,
    });
  }
}

//login controller
export async function loginController(request, response) {
  try {
    const { email, password } = request.body;

    // ✅ 1. Validate Input
    if (!email || !password) {
      return response.status(400).json({
        message: "Provide email and password",
        error: true,
        success: false,
      });
    }

    // ✅ 2. Find & Update User in a Single Query
    const user = await UserModel.findOneAndUpdate(
      { email },
      { last_login_date: new Date() },
      { new: true }
    );

    // ✅ 3. Check if User Exists
    if (!user) {
      return response.status(401).json({
        message: "User not registered",
        error: true,
        success: false,
      });
    }

    // ✅ 4. Ensure Email is Verified
    if (!user.verify_email) {
      return response.status(401).json({
        message: "Please verify your email first",
        error: true,
        success: false,
      });
    }

    // ✅ 5. Check Account Status
    if (user.status !== "Active") {
      return response.status(403).json({
        message: "Account is inactive or suspended. Contact admin.",
        error: true,
        success: false,
      });
    }

    // Use the new method from the model
    const isMatch = await user.comparePassword(password);
    console.log("Password Match:", isMatch);

    if (!isMatch) {
      return response.status(401).json({
        message: "Incorrect password",
        error: true,
        success: false,
      });
    }

    // ✅ 7. Generate Tokens
    const accessToken = await generatedAccessToken(user._id);
    const refreshToken = await genertedRefreshToken(user._id);

    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);

    // ✅ 8. Store Refresh Token Securely in DB
    await UserModel.findByIdAndUpdate(user._id, {
      refresh_token: refreshToken,
    });

    // ✅ 9. Secure Cookies Setup
    const cookiesOption = {
      httpOnly: true, // Prevent XSS attacks
      secure: true, // Send only over HTTPS
      sameSite: "None", // Cross-origin authentication support
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
    };

    response.cookie("accessToken", accessToken, cookiesOption);
    response.cookie("refreshToken", refreshToken, cookiesOption);

    // ✅ 10. Send Response
    return response.status(200).json({
      message: "Login successful",
      error: false,
      success: true,
      data: {
        accessToken,
        refreshToken,
        patient_verified: user.patient_verified, // Inform frontend
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error during login",
      error: true,
      success: false,
    });
  }
}


//logout controller
export async function logoutController(request, response) {
  try {
    const userId = request.user.id; // From middleware

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    response.clearCookie("accessToken", cookiesOption);
    response.clearCookie("refreshToken", cookiesOption);

    await UserModel.findByIdAndUpdate(userId, {
      refresh_token: "",
    });

    return response.json({
      message: "Logged out successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error during logout",
      error: true,
      success: false,
    });
  }
}

//upload user avatar
export async  function uploadAvatar(request,response){
    try {
        const userId = request.userId // auth middlware
        const image = request.file  // multer middleware

        const upload = await uploadImageClodinary(image)
        
        const updateUser = await UserModel.findByIdAndUpdate(userId,{
            avatar : upload.url
        })

        return response.json({
            message : "upload profile",
            success : true,
            error : false,
            data : {
                _id : userId,
                avatar : upload.url
            }
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//update user details
export async function updateUserDetails(request, response) {
  try {
    const userId = request.userId; // From auth middleware
    const { name, mobile, password } = request.body;

    if (!name && !mobile && !password) {
      return response.status(400).json({
        message:
          "Provide at least one field to update (name, mobile, password)",
        error: true,
        success: false,
      });
    }

    let hashPassword = "";
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      hashPassword = await bcryptjs.hash(password, salt);
    }

    const updatePayload = {
      ...(name && { name }),
      ...(mobile && { mobile }),
      ...(password && { password: hashPassword }),
    };

    const updateUser = await UserModel.updateOne(
      { _id: userId },
      updatePayload
    );

    return response.json({
      message: "User details updated successfully",
      error: false,
      success: true,
      data: updateUser,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error during update",
      error: true,
      success: false,
    });
  }
}

//forgot password not login
export async function forgotPasswordController(request, response) {
  try {
    const { email } = request.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return response.status(400).json({
        message: "Email not registered",
        error: true,
        success: false,
      });
    }

    const otp = generatedOtp();
    const expireTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await UserModel.findByIdAndUpdate(user._id, {
      forgot_password_otp: otp,
      forgot_password_expiry: expireTime,
    });

    await sendEmail({
      sendTo: email,
      subject: "Forgot Password - MediShop",
      html: forgotPasswordTemplate({
        name: user.name,
        otp: otp,
      }),
    });

    return response.json({
      message: "OTP sent to your email",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error during forgot password",
      error: true,
      success: false,
    });
  }
}

//verify forgot password otp
export async function verifyForgotPasswordOtp(request, response) {
  try {
    const { email, otp } = request.body;

    if (!email || !otp) {
      return response.status(400).json({
        message: "Provide email and OTP",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return response.status(400).json({
        message: "Email not registered",
        error: true,
        success: false,
      });
    }

    if (new Date() > new Date(user.forgot_password_expiry)) {
      return response.status(400).json({
        message: "OTP has expired",
        error: true,
        success: false,
      });
    }

    if (otp !== user.forgot_password_otp) {
      return response.status(400).json({
        message: "Invalid OTP",
        error: true,
        success: false,
      });
    }

    await UserModel.findByIdAndUpdate(user._id, {
      forgot_password_otp: "",
      forgot_password_expiry: "",
    });

    return response.json({
      message: "OTP verified successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error during OTP verification",
      error: true,
      success: false,
    });
  }
}

//reset the password
export async function resetpassword(request, response) {
  try {
    const { email, newPassword, confirmPassword } = request.body;

    if (!email || !newPassword || !confirmPassword) {
      return response.status(400).json({
        message: "Provide email, newPassword, and confirmPassword",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return response.status(400).json({
        message: "Email not registered",
        error: true,
        success: false,
      });
    }

    if (newPassword !== confirmPassword) {
      return response.status(400).json({
        message: "Passwords do not match",
        error: true,
        success: false,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    await UserModel.findByIdAndUpdate(user._id, {
      password: hashPassword,
    });

    return response.json({
      message: "Password reset successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error during password reset",
      error: true,
      success: false,
    });
  }
}


//refresh token controler
export async function refreshToken(request,response){
    try {
        const refreshToken = request.cookies.refreshToken || request?.headers?.authorization?.split(" ")[1]  /// [ Bearer token]

        if(!refreshToken){
            return response.status(401).json({
                message : "Invalid token",
                error  : true,
                success : false
            })
        }

        const verifyToken = await jwt.verify(refreshToken,process.env.SECRET_KEY_REFRESH_TOKEN)

        if(!verifyToken){
            return response.status(401).json({
                message : "token is expired",
                error : true,
                success : false
            })
        }

        const userId = verifyToken?._id

        const newAccessToken = await generatedAccessToken(userId)

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        response.cookie('accessToken',newAccessToken,cookiesOption)

        return response.json({
            message : "New Access token generated",
            error : false,
            success : true,
            data : {
                accessToken : newAccessToken
            }
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//get login user details
export async function userDetails(request, response) {
  try {
    const userId = request.user.id;


    console.log(userId,"userId")

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await UserModel.findById(userId)
      .select(
        "-password -refresh_token -forgot_password_otp -forgot_password_expiry"
      )
      .populate("address_details")
      .populate("shopping_cart")
      // .populate("orderHistory")
      // .populate("prescription_history.prescription_id");
      
    if (!user) {
      return response.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    return response.json({
      message: "User details retrieved",
      data: user,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error fetching user details",
      error: true,
      success: false,
    });
  }
}